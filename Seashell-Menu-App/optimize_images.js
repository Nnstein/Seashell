import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ASSETS_DIR = path.join(__dirname, 'public', 'assets');

async function processDirectory(directory) {
    if (!fs.existsSync(directory)) return;
    const files = fs.readdirSync(directory);

    for (const file of files) {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            await processDirectory(fullPath);
        } else if (/\.(jpg|jpeg|png)$/i.test(file)) {
            // Skip already optimized/small files if needed? 
            // For now, simple re-process with withoutEnlargement
            const tempPath = fullPath + '.tmp';

            try {
                console.log(`Optimizing ${file}... (${(stat.size / 1024).toFixed(2)} KB)`);

                await sharp(fullPath)
                    .resize(1200, 1200, {
                        fit: 'inside',
                        withoutEnlargement: true
                    })
                    .jpeg({ quality: 75, mozjpeg: true }) // Good compression
                    .toFile(tempPath);

                const newStat = fs.statSync(tempPath);

                // Only replace if smaller
                if (newStat.size < stat.size) {
                    fs.unlinkSync(fullPath);
                    fs.renameSync(tempPath, fullPath);
                    console.log(`  -> Reduced to ${(newStat.size / 1024).toFixed(2)} KB (-${((1 - newStat.size / stat.size) * 100).toFixed(0)}%)`);
                } else {
                    fs.unlinkSync(tempPath);
                    console.log(`  -> Skipped (no reduction)`);
                }
            } catch (err) {
                console.error(`  Error optimizing ${file}:`, err);
                if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
            }
        }
    }
}

console.log('Starting image optimization...');
processDirectory(ASSETS_DIR)
    .then(() => console.log('Optimization complete!'))
    .catch(err => console.error('Fatal error:', err));
