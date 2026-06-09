import { removeBackground } from '@imgly/background-removal-node';
import { readFileSync, writeFileSync } from 'fs';

const inputPath = 'cat-guide-raw.jpg';
const outputPath = 'cat-services.png';

console.log('Suppression du fond en cours…');
const imgBuffer = readFileSync(inputPath);
const blob = new Blob([imgBuffer], { type: 'image/jpeg' });

const result = await removeBackground(blob, {
  model: 'medium',
  output: { format: 'image/png', quality: 1 }
});

const arrayBuffer = await result.arrayBuffer();
writeFileSync(outputPath, Buffer.from(arrayBuffer));
console.log('Sauvegardé :', outputPath);
