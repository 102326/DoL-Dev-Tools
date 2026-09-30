import importlib.util
import io
from pathlib import Path
import subprocess
import sys
import tarfile
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('backup', Path(__file__).resolve().parents[1] / 'scripts/adb-backup-app-data.py')
backup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(backup)


class BackupTest(unittest.TestCase):
    def test_backup_and_failed_backup_cleanup(self):
        with tempfile.TemporaryDirectory() as folder:
            arguments = ['backup', '--serial', 'test-device', '--out', folder]

            def run(command, **options):
                self.assertEqual(command[:3], ['adb', '-s', 'test-device'])
                self.assertIn('run-as', command)
                with tarfile.open(fileobj=options['stdout'], mode='w') as archive:
                    member = tarfile.TarInfo('files/synthetic.txt')
                    member.size = 4
                    archive.addfile(member, io.BytesIO(b'test'))
                return subprocess.CompletedProcess(command, 0, stderr=b'')

            with patch.object(sys, 'argv', arguments), patch.object(backup.subprocess, 'run', side_effect=run), patch('builtins.print'):
                backup.main()
            existing = list(Path(folder).glob('*.tar'))
            self.assertEqual(len(existing), 1)
            with patch.object(sys, 'argv', arguments), patch.object(backup.subprocess, 'run', return_value=subprocess.CompletedProcess([], 1, stderr=b'not debuggable')):
                with self.assertRaisesRegex(RuntimeError, 'not debuggable'):
                    backup.main()
            self.assertEqual(list(Path(folder).glob('*.tar')), existing)
            self.assertFalse((Path(folder) / 'files').exists())

    def test_invalid_parameters_do_not_call_adb(self):
        with patch.object(sys, 'argv', ['backup', '--serial', 'test', '--package', '../invalid']), patch.object(backup.subprocess, 'run') as run, patch.object(sys, 'stderr', io.StringIO()):
            with self.assertRaises(SystemExit):
                backup.main()
            run.assert_not_called()


if __name__ == '__main__':
    unittest.main()
