const fs = require('node:fs');

async function evaluate(endpoint, source, timeoutMs = 60000) {
  const url = new URL(endpoint);
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) || url.protocol !== 'http:') {
    throw new Error('CDP endpoint must be a local HTTP address');
  }
  const response = await fetch(new URL('/json/list', url), { signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) throw new Error(`CDP target listing failed: ${response.status}`);
  const targets = await response.json();
  const pages = targets.filter(item => item.type === 'page' && item.title === 'Degrees of Lewdity');
  if (pages.length !== 1) throw new Error(`Expected one game page, found ${pages.length}`);
  const socketUrl = new URL(pages[0].webSocketDebuggerUrl);
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(socketUrl.hostname) || socketUrl.protocol !== 'ws:') {
    throw new Error('CDP WebSocket must be local');
  }
  const socket = new WebSocket(socketUrl);
  try {
    return await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('CDP evaluation timeout')), timeoutMs);
      const finish = (error, value) => {
        clearTimeout(timer);
        error ? reject(error) : resolve(value);
      };
      socket.onerror = () => finish(new Error('CDP connection failed'));
      socket.onclose = () => finish(new Error('CDP connection closed before result'));
      socket.onopen = () => socket.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: {
        expression: source, awaitPromise: true, returnByValue: true,
      } }));
      socket.onmessage = event => {
        try {
          const message = JSON.parse(event.data);
          if (message.id !== 1) return;
          if (message.error || message.result?.exceptionDetails) {
            finish(new Error(JSON.stringify(message.error || message.result.exceptionDetails)));
          } else finish(null, message.result.result.value);
        } catch (error) { finish(error); }
      };
    });
  } finally { socket.close(); }
}

async function main() {
  const [source, destination] = process.argv.slice(2);
  if (!source || source === '--help') {
    console.log('Usage: node scripts/adb-evaluate.cjs <evaluation.js> [output.json]\nSet DOL_CDP_URL for a different forwarded port (default http://127.0.0.1:50806). Executes the supplied JavaScript in the game.');
    if (!source) process.exitCode = 1;
    return;
  }
  if (process.argv.length > 4) throw new Error('Unexpected arguments');
  const value = await evaluate(process.env.DOL_CDP_URL || 'http://127.0.0.1:50806', fs.readFileSync(source, 'utf8'));
  const output = JSON.stringify(value ?? null, null, 2);
  if (destination) fs.writeFileSync(destination, output, { flag: 'wx' });
  console.log(output);
}

module.exports = { evaluate };
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
