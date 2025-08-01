const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const imagesDir = path.join(__dirname, '../public/images');
const buildImagesDir = path.join(__dirname, '../build/images');

// Ensure build images directory exists
if (!fs.existsSync(buildImagesDir)) {
  fs.mkdirSync(buildImagesDir, { recursive: true });
}

async function optimizeImages() {
  try {
    const files = fs.readdirSync(imagesDir);
    
    for (const file of files) {
      const inputPath = path.join(imagesDir, file);
      const ext = path.extname(file).toLowerCase();
      const baseName = path.basename(file, ext);
      
      // Skip if not an image
      if (!['.png', '.jpg', '.jpeg'].includes(ext)) {
        continue;
      }
      
      console.log(`Optimizing ${file}...`);
      
      // Create WebP version
      const webpPath = path.join(buildImagesDir, `${baseName}.webp`);
      await sharp(inputPath)
        .webp({ quality: 85, effort: 6 })
        .toFile(webpPath);
      
      // Create optimized original format
      const optimizedPath = path.join(buildImagesDir, file);
      if (ext === '.png') {
        await sharp(inputPath)
          .png({ quality: 90, compressionLevel: 9 })
          .toFile(optimizedPath);
      } else {
        await sharp(inputPath)
          .jpeg({ quality: 85, progressive: true })
          .toFile(optimizedPath);
      }
      
      // Create responsive sizes for large images
      const metadata = await sharp(inputPath).metadata();
      if (metadata.width > 800) {
        // Create medium size (800px wide)
        const mediumWebpPath = path.join(buildImagesDir, `${baseName}-medium.webp`);
        const mediumPath = path.join(buildImagesDir, `${baseName}-medium${ext}`);
        
        await sharp(inputPath)
          .resize(800, null, { withoutEnlargement: true })
          .webp({ quality: 85, effort: 6 })
          .toFile(mediumWebpPath);
          
        if (ext === '.png') {
          await sharp(inputPath)
            .resize(800, null, { withoutEnlargement: true })
            .png({ quality: 90, compressionLevel: 9 })
            .toFile(mediumPath);
        } else {
          await sharp(inputPath)
            .resize(800, null, { withoutEnlargement: true })
            .jpeg({ quality: 85, progressive: true })
            .toFile(mediumPath);
        }
      }
      
      if (metadata.width > 400) {
        // Create small size (400px wide)
        const smallWebpPath = path.join(buildImagesDir, `${baseName}-small.webp`);
        const smallPath = path.join(buildImagesDir, `${baseName}-small${ext}`);
        
        await sharp(inputPath)
          .resize(400, null, { withoutEnlargement: true })
          .webp({ quality: 80, effort: 6 })
          .toFile(smallWebpPath);
          
        if (ext === '.png') {
          await sharp(inputPath)
            .resize(400, null, { withoutEnlargement: true })
            .png({ quality: 85, compressionLevel: 9 })
            .toFile(smallPath);
        } else {
          await sharp(inputPath)
            .resize(400, null, { withoutEnlargement: true })
            .jpeg({ quality: 80, progressive: true })
            .toFile(smallPath);
        }
      }
    }
    
    console.log('Image optimization completed!');
  } catch (error) {
    console.error('Error optimizing images:', error);
    // Don't fail the build if image optimization fails
    process.exit(0);
  }
}

// Only run if sharp is available (optional dependency)
try {
  require.resolve('sharp');
  optimizeImages();
} catch (e) {
  console.log('Sharp not available, skipping image optimization');
  console.log('To enable image optimization, install sharp: npm install sharp');

  // Copy original images to build directory as fallback
  try {
    const files = fs.readdirSync(imagesDir);
    for (const file of files) {
      const inputPath = path.join(imagesDir, file);
      const outputPath = path.join(buildImagesDir, file);
      fs.copyFileSync(inputPath, outputPath);
    }
    console.log('Original images copied to build directory');
  } catch (copyError) {
    console.log('Could not copy images:', copyError.message);
  }
}
