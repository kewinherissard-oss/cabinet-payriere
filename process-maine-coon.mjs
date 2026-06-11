import { removeBackground } from '@imgly/background-removal-node';
import { readFileSync, writeFileSync } from 'fs';

const INPUT = 'Maine coon leve patte.jpg';
const OUTPUT = 'services-cat-nobg.png';

console.log(`Lecture de "${INPUT}"…`);
const imgBuffer = readFileSync(INPUT);
const blob = new Blob([imgBuffer], { type: 'image/jpeg' });

console.log('Suppression du fond en cours (30-60s)…');
const result = await removeBackground(blob, {
  model: 'medium',
  output: { format: 'image/png', quality: 1 }
});

const arrayBuffer = await result.arrayBuffer();
writeFileSync(OUTPUT, Buffer.from(arrayBuffer));
console.log(`Sauvegardé : ${OUTPUT} (${(arrayBuffer.byteLength / 1024).toFixed(0)} KB)`);
