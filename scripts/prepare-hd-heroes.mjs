// High-density variants of the full-bleed chapter heroes.
//
// On a 3x phone a cover-cropped hero is shown 2-2.5x larger than these
// ~1100-1900px exports, and the browser's bilinear upscale reads as blur.
// The original photos are no longer available, so this pre-scales the
// existing exports with Lanczos plus a light unsharp mask; pages serve them
// through srcSet to 2x+ screens only.
import { mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const assets = join(root, 'public', 'assets')
const outDir = join(assets, 'hd')
mkdirSync(outDir, { recursive: true })

const heroes = ['robot-build', 'teamwork-trophy', 'uoa-campus', 'klzc-abstract-bg']
const LONG_EDGE = 2600

for (const name of heroes) {
  const input = join(assets, `${name}.webp`)
  const { width = 1, height = 1 } = await sharp(input).metadata()
  const scale = Math.min(2, LONG_EDGE / Math.max(width, height))
  await sharp(input)
    .resize(Math.round(width * scale), Math.round(height * scale), { kernel: 'lanczos3' })
    .sharpen({ sigma: 0.9, m1: 0.6, m2: 1.8 })
    .webp({ quality: 80, effort: 5 })
    .toFile(join(outDir, `${name}.webp`))
  console.log(`${name}: ${width}x${height} -> x${scale.toFixed(2)}`)
}
