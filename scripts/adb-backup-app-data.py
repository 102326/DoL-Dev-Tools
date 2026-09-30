"""Read a debuggable app's private data through ADB; never restore or extract it."""
import argparse
from datetime import datetime
import hashlib
from pathlib import Path
import re
import subprocess
import tarfile


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--adb', default='adb', help='ADB executable on PATH, or its full path')
    parser.add_argument('--serial', required=True, help='Device serial from adb devices')
    parser.add_argument('--package', default='com.vrelnir.dol.lyra')
    parser.add_argument('--out', type=Path, default=Path(__file__).resolve().parents[1] / 'backups')
    parser.add_argument('--label', default='before-test')
    args = parser.parse_args()
    if not re.fullmatch(r'[a-z0-9-]{1,40}', args.label):
        parser.error('Label must contain 1-40 lowercase letters, digits or hyphens')
    if not re.fullmatch(r'[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)+', args.package):
        parser.error('Invalid Android package name')
    args.out.mkdir(parents=True, exist_ok=True)
    path = args.out / f'{args.package}-{args.label}-{datetime.now():%Y%m%d-%H%M%S-%f}.tar'
    created = False
    try:
        with path.open('xb') as stream:
            created = True
            result = subprocess.run([args.adb, '-s', args.serial, 'exec-out', 'run-as', args.package,
                                     'tar', '-cf', '-', '.'], stdout=stream, stderr=subprocess.PIPE,
                                    check=False, timeout=180)
        if result.returncode:
            raise RuntimeError(result.stderr.decode(errors='replace'))
        with tarfile.open(path) as archive:
            members = archive.getmembers()
            if not members:
                raise RuntimeError('Empty backup')
            for member in members:
                if member.isfile():
                    with archive.extractfile(member) as stream:
                        while stream.read(1024 * 1024):
                            pass
        digest = hashlib.sha256()
        with path.open('rb') as stream:
            while chunk := stream.read(1024 * 1024):
                digest.update(chunk)
    except Exception:
        if created:
            path.unlink(missing_ok=True)
        raise
    print(f'{path}\nbytes={path.stat().st_size} members={len(members)} sha256={digest.hexdigest()}')


if __name__ == '__main__':
    main()
