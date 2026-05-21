import gltfPipeline from 'gltf-pipeline';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { processGlb } = gltfPipeline;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modelsDir = path.join(__dirname, 'public', 'assets', 'models', 'new');
const outputDir = path.join(__dirname, 'public', 'assets', 'models', 'new-compressed');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Get all GLB files
const files = fs.readdirSync(modelsDir).filter(file => file.endsWith('.glb'));

console.log(`Found ${files.length} GLB files to compress...\n`);

// Process each file
for (const file of files) {
    const inputPath = path.join(modelsDir, file);
    const outputPath = path.join(outputDir, file);

    console.log(`Processing: ${file}`);

    try {
        const inputStats = fs.statSync(inputPath);
        const inputSizeKB = (inputStats.size / 1024).toFixed(2);

        const glb = fs.readFileSync(inputPath);

        const results = await processGlb(glb, {
            dracoOptions: {
                compressionLevel: 10, // Maximum compression (0-10)
                quantizePositionBits: 14,
                quantizeNormalBits: 10,
                quantizeTexcoordBits: 12,
                quantizeColorBits: 8,
                quantizeGenericBits: 12,
                unifiedQuantization: true
            }
        });

        fs.writeFileSync(outputPath, results.glb);

        const outputStats = fs.statSync(outputPath);
        const outputSizeKB = (outputStats.size / 1024).toFixed(2);
        const reduction = ((1 - outputStats.size / inputStats.size) * 100).toFixed(1);

        console.log(`  Original: ${inputSizeKB} KB`);
        console.log(`  Compressed: ${outputSizeKB} KB`);
        console.log(`  Reduction: ${reduction}%\n`);

    } catch (error) {
        console.error(`  Error processing ${file}:`, error.message);
        console.log('');
    }
}

console.log('Compression complete!');
console.log(`Compressed files saved to: ${outputDir}`);
