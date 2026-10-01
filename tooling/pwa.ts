import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'
import type { Plugin } from 'vite'

export function renderServiceWorker(files: string[], version: string): string {
  return readFileSync(new URL('./service-worker.js', import.meta.url), 'utf8')
    .replace('__BUILD_VERSION__', JSON.stringify(version)).replace('__PRECACHE_FILES__', JSON.stringify(files))
}

// Small deterministic scoreboard icon; generated assets are not secrets/source.
export function scoreboardIcon(size: number): Buffer {
  const pixels = Buffer.alloc((size * 4 + 1) * size)
  const zero = (x: number, y: number, left: number) =>
    (x >= left && x <= left + .14 && (y >= .33 && y <= .36 || y >= .64 && y <= .67)) ||
    (y >= .33 && y <= .67 && (x >= left && x <= left + .03 || x >= left + .11 && x <= left + .14))
  for (let row = 0; row < size; row++) for (let column = 0; column < size; column++) {
    const x = column / size, y = row / size, offset = row * (size * 4 + 1) + 1 + column * 4
    const white = zero(x, y, .28)
    const blue = zero(x, y, .58)
    const colon = x >= .48 && x <= .52 && (y >= .41 && y <= .45 || y >= .55 && y <= .59)
    const border = x >= .2 && x <= .8 && y >= .25 && y <= .75 && (x <= .21 || x >= .79 || y <= .26 || y >= .74)
    const color = white ? [240, 248, 255] : blue || colon || border ? [65, 200, 255] : [9, 15, 28]
    pixels.set([...color, 255], offset)
  }
  const chunk = (type: string, data: Buffer) => {
    const content = Buffer.concat([Buffer.from(type), data])
    let crc = 0xffffffff
    for (const byte of content) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = crc & 1 ? 0xedb88320 ^ crc >>> 1 : crc >>> 1 }
    const length = Buffer.alloc(4), checksum = Buffer.alloc(4)
    length.writeUInt32BE(data.length); checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0)
    return Buffer.concat([length, content, checksum])
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4); header[8] = 8; header[9] = 6
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('IDAT', deflateSync(pixels)), chunk('IEND', Buffer.alloc(0))])
}

export function pwaPlugin(): Plugin {
  return {
    name: 'marcador-offline-shell', apply: 'build', enforce: 'post',
    transformIndexHtml() {
      return [
        { tag: 'link', attrs: { rel: 'manifest', href: '/manifest.webmanifest' }, injectTo: 'head' },
        { tag: 'link', attrs: { rel: 'apple-touch-icon', href: '/icon-192.png' }, injectTo: 'head' },
      ]
    },
    generateBundle(_options, bundle) {
      const manifest = JSON.stringify({
        id: '/', name: 'MARCADOR FUTBOLÍN V3', short_name: 'Futbolín V3', lang: 'es',
        description: 'Marcador táctil de futbolín con recuperación local de partidos.',
        start_url: '/', scope: '/', display: 'standalone', background_color: '#090f1c', theme_color: '#090f1c',
        icons: [192, 512].map(size => ({ src: `icon-${size}.png`, sizes: `${size}x${size}`, type: 'image/png', purpose: 'any maskable' })),
      })
      const assets = new Map<string, string | Buffer>([['manifest.webmanifest', manifest], ['icon-192.png', scoreboardIcon(192)], ['icon-512.png', scoreboardIcon(512)]])
      for (const [fileName, source] of assets) this.emitFile({ type: 'asset', fileName, source })
      const files = [...Object.keys(bundle).filter(path => /\.(html|js|css)$/.test(path)), ...assets.keys()].sort()
      const template = readFileSync(new URL('./service-worker.js', import.meta.url), 'utf8')
      const hash = createHash('sha256').update(template)
      for (const path of files) {
        const entry = bundle[path]
        hash.update(path).update(assets.get(path) ?? (entry.type === 'chunk' ? entry.code : entry.source))
      }
      const version = hash.digest('hex').slice(0, 20)
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: renderServiceWorker(files, version) })
      // Intentionally not cached: verifies reachability, not just a LAN interface.
      this.emitFile({ type: 'asset', fileName: 'connection.json', source: '{"application":"marcador-futbolin-v3"}' })
    },
  }
}
