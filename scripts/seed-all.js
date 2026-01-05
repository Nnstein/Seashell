/**
 * Master Seed Script
 * Runs all seed scripts in sequence to populate the Firestore database.
 * 
 * Usage: node scripts/seed-all.js
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const seedsDir = path.join(__dirname, 'seeds');

// Get all seed files
const seedFiles = fs.readdirSync(seedsDir)
    .filter(file => file.startsWith('seed-') && file.endsWith('.js'))
    .sort();

console.log('🌱 SEASHELL DATABASE SEEDER');
console.log('='.repeat(50));
console.log(`Found ${seedFiles.length} seed files to run:\n`);

seedFiles.forEach((file, index) => {
    console.log(`  ${index + 1}. ${file}`);
});

console.log('\n' + '='.repeat(50));
console.log('Starting seeding process...\n');

let successCount = 0;
let failCount = 0;

for (const file of seedFiles) {
    const filePath = path.join(seedsDir, file);
    console.log(`\n📦 Running: ${file}`);
    console.log('-'.repeat(40));

    try {
        execSync(`node "${filePath}"`, {
            stdio: 'inherit',
            cwd: path.join(__dirname, '..')
        });
        successCount++;
        console.log(`✅ ${file} completed successfully`);
    } catch (error) {
        failCount++;
        console.error(`❌ ${file} failed:`, error.message);
    }
}

console.log('\n' + '='.repeat(50));
console.log('SEEDING COMPLETE');
console.log(`✅ Successful: ${successCount}`);
console.log(`❌ Failed: ${failCount}`);
console.log('='.repeat(50));

process.exit(failCount > 0 ? 1 : 0);
