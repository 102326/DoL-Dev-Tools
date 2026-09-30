const assert = require('node:assert/strict');
const { test } = require('node:test');
const { evaluate } = require('../scripts/adb-evaluate.cjs');

test('CDP evaluation handles results, errors, ambiguity and timeouts', async () => {
  const oldFetch = global.fetch;
  const oldSocket = global.WebSocket;
  let pages, reply, closed = 0;
  global.fetch = async () => ({ ok: true, json: async () => pages });
  global.WebSocket = class {
    constructor() { queueMicrotask(() => this.onopen()); }
    send(source) {
      const request = JSON.parse(source);
      assert.equal(request.method, 'Runtime.evaluate');
      assert.equal(request.params.expression, '42');
      if (reply) queueMicrotask(() => this.onmessage({ data: JSON.stringify(reply) }));
    }
    close() { closed++; }
  };
  try {
    const page = { type: 'page', title: 'Degrees of Lewdity', webSocketDebuggerUrl: 'ws://127.0.0.1:50806/devtools/page/1' };
    pages = [page];
    reply = { id: 1, result: { result: { value: 42 } } };
    assert.equal(await evaluate('http://127.0.0.1:50806', '42'), 42);
    reply = { id: 1, result: { exceptionDetails: { text: 'Error: probe failed' } } };
    await assert.rejects(evaluate('http://127.0.0.1:50806', '42'), /probe failed/);
    reply = null;
    await assert.rejects(evaluate('http://127.0.0.1:50806', '42', 10), /timeout/);
    assert.equal(closed, 3);
    pages = [page, page];
    await assert.rejects(evaluate('http://127.0.0.1:50806', '42'), /found 2/);
    pages = [];
    await assert.rejects(evaluate('http://127.0.0.1:50806', '42'), /found 0/);
    await assert.rejects(evaluate('http://example.com', '42'), /local HTTP/);
    pages = [{ ...page, webSocketDebuggerUrl: 'ws://example.com/debug' }];
    await assert.rejects(evaluate('http://localhost', '42'), /WebSocket must be local/);
  } finally {
    global.fetch = oldFetch;
    global.WebSocket = oldSocket;
  }
});

test('CLI refuses to overwrite an existing report', async () => {
  const fs = require('node:fs');
  const os = require('node:os');
  const path = require('node:path');
  const { spawnSync } = require('node:child_process');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dol-tools-'));
  try {
    const shim = path.join(dir, 'shim.cjs');
    const source = path.join(dir, 'probe.js');
    const output = path.join(dir, 'result.json');
    fs.writeFileSync(source, '42');
    fs.writeFileSync(output, 'keep');
    fs.writeFileSync(shim, `global.fetch=async()=>({ok:true,json:async()=>[{type:'page',title:'Degrees of Lewdity',webSocketDebuggerUrl:'ws://localhost/debug'}]});global.WebSocket=class{constructor(){queueMicrotask(()=>this.onopen())}send(){queueMicrotask(()=>this.onmessage({data:JSON.stringify({id:1,result:{result:{value:42}}})}))}close(){}};`);
    const run = spawnSync(process.execPath, ['--require', shim, path.resolve(__dirname, '../scripts/adb-evaluate.cjs'), source, output], { encoding: 'utf8' });
    assert.equal(run.status, 1);
    assert.match(run.stderr, /EEXIST/);
    assert.equal(fs.readFileSync(output, 'utf8'), 'keep');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
