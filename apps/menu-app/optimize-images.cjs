const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, 'public', 'assets', 'images');

async function optimizeImage(filePath) {
    try {
        const stats = fs.statSync(filePath);
        const originalSize = stats.size;

        // Read the image
        const image = sharp(filePath);
        const metadata = await image.metadata();

        // Optimize based on current size
        let quality = 80; // Default quality

        if (originalSize > 200000) { // > 200KB
            quality = 70;
        } else if (originalSize > 100000) { // > 100KB
            quality = 75;
        }

        // Create a temporary output path
        const tempPath = filePath.replace('.jpg', '_optimized.jpg');

        // Optimize the image
        await image
            .jpeg({ quality, progressive: true, mozjpeg: true })
            .toFile(tempPath);

        const newStats = fs.statSync(tempPath);
        const newSize = newStats.size;
        const reduction = ((originalSize - newSize) / originalSize * 100).toFixed(2);

        // Only replace if we achieved meaningful compression
        if (newSize < originalSize) {
            fs.unlinkSync(filePath);
            fs.renameSync(tempPath, filePath);
            console.log(`✓ ${path.basename(filePath)}: ${(originalSize / 1024).toFixed(2)}KB → ${(newSize / 1024).toFixed(2)}KB (${reduction}% reduction)`);
            return { original: originalSize, new: newSize, reduction };
        } else {
            fs.unlinkSync(tempPath);
            console.log(`⊘ ${path.basename(filePath)}: Already optimized`);
            return { original: originalSize, new: originalSize, reduction: 0 };
        }
    } catch (error) {
        console.error(`✗ Error optimizing ${path.basename(filePath)}:`, error.message);
        return null;
    }
}

async function optimizeDirectory(dir) {
    const files = fs.readdirSync(dir);
    const results = [];

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            const subResults = await optimizeDirectory(filePath);
            results.push(...subResults);
        } else if (file.endsWith('.jpg') || file.endsWith('.jpeg')) {
            const result = await optimizeImage(filePath);
            if (result) results.push(result);
        }
    }

    return results;
}

async function main() {
    console.log('🖼️  Starting image optimization...\n');

    const results = await optimizeDirectory(ASSETS_DIR);

    console.log('\n📊 Optimization Summary:');
    console.log('========================');

    const totalOriginal = results.reduce((sum, r) => sum + r.original, 0);
    const totalNew = results.reduce((sum, r) => sum + r.new, 0);
    const totalReduction = ((totalOriginal - totalNew) / totalOriginal * 100).toFixed(2);

    console.log(`Total files processed: ${results.length}`);
    console.log(`Original size: ${(totalOriginal / 1024).toFixed(2)} KB`);
    console.log(`Optimized size: ${(totalNew / 1024).toFixed(2)} KB`);
    console.log(`Total reduction: ${totalReduction}%`);
    console.log(`Space saved: ${((totalOriginal - totalNew) / 1024).toFixed(2)} KB`);

    console.log('\n✅ Optimization complete!');
}

main().catch(console.error);
