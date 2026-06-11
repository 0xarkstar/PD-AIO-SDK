// Throwaway recon: capture StandX market stream frames (keyless)
import WebSocket from 'ws'
import fs from 'node:fs'

const OUT = '/tmp/m3-recon/standx/ws-frames.ndjson'
const url = 'wss://perps.standx.com/ws-stream/v1'
const ws = new WebSocket(url)
const stream = fs.createWriteStream(OUT)
let count = 0
const counts = {}

ws.on('open', () => {
  console.log('OPEN', url)
  ws.send(JSON.stringify({ subscribe: { channel: 'depth_book', symbol: 'BTC-USD' } }))
  ws.send(JSON.stringify({ subscribe: { channel: 'public_trade', symbol: 'BTC-USD' } }))
  ws.send(JSON.stringify({ subscribe: { channel: 'price', symbol: 'BTC-USD' } }))
})
ws.on('message', (data) => {
  const raw = data.toString()
  stream.write(raw + '\n')
  count += 1
  try {
    const j = JSON.parse(raw)
    const ch = j.channel ?? 'unknown'
    counts[ch] = (counts[ch] ?? 0) + 1
  } catch {
    counts.nonjson = (counts.nonjson ?? 0) + 1
  }
})
ws.on('error', (e) => { console.error('ERROR', e.message) })
ws.on('close', (c, r) => { console.log('CLOSE', c, r.toString()) })

setTimeout(() => {
  console.log('FRAMES', count, JSON.stringify(counts))
  ws.close()
  stream.end()
  setTimeout(() => process.exit(0), 500)
}, 12000)
