import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = resolve(root, '..');
const outDir = join(root, 'public', 'assets');
const tmpDir = join(root, '.asset-tmp');
const awardSourceDir = join(sourceRoot, '获奖');

mkdirSync(outDir, { recursive: true });
rmSync(tmpDir, { recursive: true, force: true });
mkdirSync(tmpDir, { recursive: true });

const photos = [
  {
    source: join(sourceRoot, '个人照片', '75c309fce0f843b5ccd8e12099cfa5ba.jpg'),
    output: 'hero-klzc.webp',
    width: 2200,
  },
  {
    source: join(sourceRoot, '个人照片', '1349bd512be20ecacc7f1c80c45d74c0.jpg'),
    output: 'portrait-klzc.webp',
    width: 1100,
  },
  {
    source: join(sourceRoot, '个人照片', '20eb32bacac8178660e936cd92f8c620.jpg'),
    output: 'robotics-klzc.webp',
    width: 900,
  },
  {
    source: join(sourceRoot, '机器比赛照片', '8272cc3c07c42fb3628c03a51a510276.jpg'),
    output: 'vex-asia-pacific.webp',
    width: 1600,
  },
  {
    source: join(sourceRoot, '机器比赛照片', '5f577972a936b2fa1778f0f9e9352f30.jpg'),
    output: 'robot-74000m.webp',
    width: 1100,
  },
  {
    source: join(sourceRoot, '机器比赛照片', 'bb1e107b38a482ca01679af3aa9cc5cd.jpg'),
    output: 'robot-build.webp',
    width: 1100,
  },
  {
    source: join(sourceRoot, '机器比赛照片', '493243d9f6f16e7c5f6f6165aeea2e62.jpg'),
    output: 'team-74000m.webp',
    width: 1600,
  },
  {
    source: join(sourceRoot, '机器比赛照片', 'a6145ca38a3204b81ae03f0caafb2fba.jpg'),
    output: 'teamwork-trophy.webp',
    width: 1000,
  },
];

for (const photo of photos) {
  await sharp(photo.source)
    .rotate()
    .resize({ width: photo.width, withoutEnlargement: true })
    .webp({ quality: 82, effort: 5 })
    .toFile(join(outDir, photo.output));
}

const externalPhotos = [
  {
    url: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/University%20of%20Auckland%2C%20Grafton%20Campus%2C%202016-01-21.jpg',
    tmp: 'uoa-campus.jpg',
    output: 'uoa-campus.webp',
    width: 1600,
  },
];

for (const photo of externalPhotos) {
  const response = await fetch(photo.url, { redirect: 'follow' });
  if (!response.ok) {
    throw new Error(`Failed to download ${photo.url}: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await sharp(buffer)
    .rotate()
    .resize({ width: photo.width, withoutEnlargement: true })
    .webp({ quality: 78, effort: 5 })
    .toFile(join(outDir, photo.output));
}

const pdfPrefix = join(tmpDir, 'award-page');
execFileSync('pdftoppm', ['-png', '-r', '130', '-f', '1', '-l', '6', join(awardSourceDir, '奖状.pdf'), pdfPrefix], {
  stdio: 'inherit',
});

const awardFiles = readdirSync(tmpDir)
  .filter((file) => /^award-page-\d+\.png$/.test(file))
  .sort((a, b) => Number(a.match(/\d+/)?.[0]) - Number(b.match(/\d+/)?.[0]));

for (const [index, file] of awardFiles.entries()) {
  const input = join(tmpDir, file);
  await sharp(input)
    .rotate()
    .resize({ width: 900, withoutEnlargement: true })
    .webp({ quality: 80, effort: 5 })
    .toFile(join(outDir, `award-${index + 1}.webp`));
}

execFileSync('pdftoppm', ['-png', '-r', '140', '-f', '1', '-l', '1', join(awardSourceDir, '20191224102713_8762.pdf'), join(tmpDir, 'award-extra-pdf')], {
  stdio: 'inherit',
});

await sharp(join(tmpDir, 'award-extra-pdf-1.png'))
  .rotate()
  .resize({ width: 1100, withoutEnlargement: true })
  .webp({ quality: 82, effort: 5 })
  .toFile(join(outDir, 'award-7.webp'));

await sharp(join(awardSourceDir, '3293c5f05bc6d57644e674400a46e8a8.jpg'))
  .rotate()
  .resize({ width: 900, withoutEnlargement: true })
  .webp({ quality: 82, effort: 5 })
  .toFile(join(outDir, 'award-8.webp'));

rmSync(tmpDir, { recursive: true, force: true });
