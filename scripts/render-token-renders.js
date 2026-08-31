const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const sizes = [32, 64, 128];
const srcDir = path.join(__dirname, '..', 'apps', 'wallet', 'src', 'assets', 'tokens');
const outDir = path.join(srcDir, 'renders');

if (!fs.existsSync(srcDir)) {
  console.error('Source tokens directory not found:', srcDir);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
for (const size of sizes) fs.mkdirSync(path.join(outDir, String(size)), { recursive: true });

const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.svg'));

(async () => {
  for (const file of files) {
    const filePath = path.join(srcDir, file);
    const name = path.basename(file, '.svg');
    const svgBuffer = fs.readFileSync(filePath);

    for (const size of sizes) {
      const outPath = path.join(outDir, String(size), `${name}.png`);
      try {
        await sharp(svgBuffer)
          .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toFile(outPath);
        console.log(`Wrote ${outPath}`);
      } catch (err) {
        console.error('Failed to render', filePath, '->', outPath, err);
      }
    }
  }
})();
