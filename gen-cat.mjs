import { writeFileSync } from 'fs';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const prompt = `A professional studio close-up portrait photograph of a beautiful tabby cat with vivid glowing green eyes looking directly at the camera with a noble intense gaze. The cat's face fills 70% of the frame. Rich warm golden-brown tabby fur with dark stripes, sharp whiskers. Deep dark navy blue background seamlessly fading to near-black at the edges. Soft studio key light from upper-left creating gentle rim highlights on the fur. Cinematic, photorealistic, ultra high quality, portrait orientation, no text, no watermarks.`;

// Try Imagen 4 first
console.log('Essai Imagen 4…');
const imagenUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${GEMINI_API_KEY}`;
const imagenResp = await fetch(imagenUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    instances: [{ prompt }],
    parameters: { sampleCount: 1, aspectRatio: '9:16' }
  })
});
const imagenData = await imagenResp.json();

if (!imagenData.error) {
  const img = imagenData.predictions?.[0]?.bytesBase64Encoded;
  if (img) {
    writeFileSync('services-cat-ai.png', Buffer.from(img, 'base64'));
    console.log('Sauvegardé via Imagen 4 : services-cat-ai.png');
    process.exit(0);
  }
}
console.log('Imagen 4 fail:', imagenData.error?.message?.substring(0, 120) ?? 'no image');

// Fallback: Gemini 2.5 flash image
console.log('Essai gemini-2.5-flash-image…');
const gemUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`;
const gemResp = await fetch(gemUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
  })
});
const gemData = await gemResp.json();
if (gemData.error) { console.error('Gemini fail:', gemData.error.message.substring(0, 120)); process.exit(1); }

for (const part of gemData.candidates?.[0]?.content?.parts ?? []) {
  if (part.inlineData) {
    writeFileSync('services-cat-ai.png', Buffer.from(part.inlineData.data, 'base64'));
    console.log('Sauvegardé via Gemini : services-cat-ai.png');
    process.exit(0);
  }
}
console.log('Aucune image dans la réponse:', JSON.stringify(gemData).substring(0, 200));
