/* Extended WS recon capture — byte-faithful raw frames.
 * Usage: node capture.cjs <streamPath> <outPrefix> <ms>
 * e.g. node capture.cjs orderbooks/BTC-USD orderbook 15000
 */
const fs = require('fs');
const path = require('path');
const WebSocket = require('/Users/arkstar/Projects/PD-AIO-SDK/node_modules/ws');

const streamPath = process.argv[2];
const outPrefix = process.argv[3];
const durationMs = parseInt(process.argv[4] || '15000', 10);

const BASE = 'wss://api.starknet.extended.exchange/stream.extended.exchange/v1';
const url = `${BASE}/${streamPath}`;
const outDir = '/tmp/m3-recon/extended';

const frames = []; // { t: recvEpochMs, raw: string }
const startedAt = Date.now();

const ws = new WebSocket(url, {
  headers: { 'User-Agent': 'pd-aio-sdk-recon/0.1' },
});

let opened = false;
ws.on('open', () => {
  opened = true;
  console.log(`OPEN ${url}`);
});
ws.on('ping', (d) => console.log(`PING from server (${d.length}b) at +${Date.now() - startedAt}ms`));
ws.on('pong', () => console.log('PONG from server'));
ws.on('message', (data) => {
  frames.push({ t: Date.now(), raw: data.toString('utf8') });
});
ws.on('error', (err) => {
  console.error(`ERROR ${url}: ${err.message}`);
});
ws.on('close', (code, reason) => {
  console.log(`CLOSE code=${code} reason=${reason ? reason.toString() : ''}`);
});

setTimeout(() => {
  try { ws.close(1000); } catch (_) {}
  // byte-faithful: write each raw frame text verbatim, one file for first frame,
  // one NDJSON-style concat (frames have no newlines) for the rest + meta.
  if (frames.length > 0) {
    fs.writeFileSync(path.join(outDir, `${outPrefix}_frame_000.raw.json`), frames[0].raw);
    if (frames.length > 1) {
      const rest = frames.slice(1, 21).map((f) => f.raw).join('\n');
      fs.writeFileSync(path.join(outDir, `${outPrefix}_frames_001-020.raw.ndjson`), rest);
    }
    const deltas = frames.slice(1).map((f, i) => f.t - frames[i].t);
    const meta = {
      url,
      opened,
      captureMs: durationMs,
      frameCount: frames.length,
      firstFrameBytes: Buffer.byteLength(frames[0].raw),
      meanInterFrameMs: deltas.length ? Math.round(deltas.reduce((a, b) => a + b, 0) / deltas.length) : null,
      minInterFrameMs: deltas.length ? Math.min(...deltas) : null,
      maxInterFrameMs: deltas.length ? Math.max(...deltas) : null,
      firstRecvAt: frames[0].t,
      lastRecvAt: frames[frames.length - 1].t,
    };
    fs.writeFileSync(path.join(outDir, `${outPrefix}_meta.json`), JSON.stringify(meta, null, 2));
    console.log(JSON.stringify(meta, null, 2));
  } else {
    console.log(`NO FRAMES captured for ${url} (opened=${opened})`);
  }
  process.exit(0);
}, durationMs);
