#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const postcss = require('postcss');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');

// Ensure the styles directory exists
const stylesDir = path.join(__dirname, 'src', 'styles');
if (!fs.existsSync(stylesDir)) {
  fs.mkdirSync(stylesDir, { recursive: true });
}

// Read the input CSS file
const inputCss = fs.readFileSync('src/global.css', 'utf8');
const outputPath = 'src/styles/output.css';

console.log('Building Tailwind CSS...');
try {
  // Process the CSS with PostCSS plugins
  postcss([
    tailwindcss('./tailwind.config.js'),
    autoprefixer
  ])
  .process(inputCss, { from: 'src/global.css', to: outputPath })
  .then(result => {
    // Write the processed CSS to the output file
    fs.writeFileSync(outputPath, result.css);
    if (result.map) {
      fs.writeFileSync(`${outputPath}.map`, result.map.toString());
    }
    console.log('Tailwind CSS build completed successfully!');
  })
  .catch(error => {
    console.error('Error processing CSS:', error);
    process.exit(1);
  });
} catch (error) {
  console.error('Error building Tailwind CSS:', error.message);
  process.exit(1);
}
