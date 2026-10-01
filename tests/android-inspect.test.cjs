const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { inspect } = require('../scripts/android-inspect.cjs');

test('CLI collection pins device, disables metrics, preserves failures and refuses overwrite', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'dol-cli-'));
  try {
    const calls = [];
    const run = (exe, args) => {
      calls.push(args);
      assert.equal(exe, 'fake-android');
      assert.ok(args.includes('--no-metrics'));
      const destination = args.find(a => a.startsWith('--output='))?.slice(9);
      if (destination?.endsWith('.png')) {
        const png = Buffer.alloc(24);
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(png);
        png.writeUInt32BE(1200, 16); png.writeUInt32BE(2608, 20);
        fs.writeFileSync(destination, png);
      } else if (destination) fs.writeFileSync(destination, '[{"type":"APPLICATION"}]');
      return { status: 0, stdout: '1.0.test', stderr: '' };
    };
    const directory = path.join(temp, 'ok');
    assert.equal(inspect('device-1', directory, { run, cli: 'fake-android', sdk: 'existing-sdk' }).complete, true);
    assert.equal(calls.length, 4);
    assert.ok(calls.slice(1).every(a => a.includes('--device=device-1')));
    const original = fs.readFileSync(path.join(directory, 'report.json'), 'utf8');
    assert.throws(() => inspect('device-1', directory, { run }), /EEXIST/);
    assert.equal(fs.readFileSync(path.join(directory, 'report.json'), 'utf8'), original);
    assert.throws(() => inspect('bad serial', path.join(temp, 'bad')), /serial/);
    const failure = path.join(temp, 'failure');
    assert.throws(() => inspect('device-1', failure, { cli: 'fake-android', run: () => ({ status: 1, stderr: 'INSTALL_FAILED_USER_RESTRICTED' }) }), /failed/);
    const report = JSON.parse(fs.readFileSync(path.join(failure, 'report.json'), 'utf8'));
    assert.equal(report.complete, false);
    assert.equal(report.checks.length, 1);
    assert.match(report.checks[0].stderr, /INSTALL_FAILED/);
  } finally { fs.rmSync(temp, { recursive: true }); }
});
