import { removeBackground } from '@imgly/background-removal-node';
import { readFileSync, writeFileSync } from 'fs';

const UNSPLASH_URL = 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800&h=1200&fit=crop&crop=entropy&q=95';
const RAW_PATH = 'services-cat-raw.jpg';
const OUTPUT_PATH = 'services-cat-nobg.png';

console.log('Téléchargement du chat depuis Unsplash…');
const resp = await fetch(UNSPLASH_URL);
const buf = Buffer.from(await resp.arrayBuffer());
writeFileSync(RAW_PATH, buf);
console.log(`Téléchargé : ${RAW_PATH} (${(buf.length / 1024).toFixed(0)} KB)`);

console.log('Suppression du fond en cours (30-60s)…');
const imgBuffer = readFileSync(RAW_PATH);
const blob = new Blob([imgBuffer], { type: 'image/jpeg' });

const result = await removeBackground(blob, {
  model: 'medium',
  output: { format: 'image/png', quality: 1 }
});

const arrayBuffer = await result.arrayBuffer();
writeFileSync(OUTPUT_PATH, Buffer.from(arrayBuffer));
console.log(`Sauvegardé : ${OUTPUT_PATH} (${(arrayBuffer.byteLength / 1024).toFixed(0)} KB)`);
