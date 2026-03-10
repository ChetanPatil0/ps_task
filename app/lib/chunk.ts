export function chunkText(text: string, targetSize = 300, overlap = 50): string[] {
  const sentences = text
    .replace(/\r\n/g, "\n")
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    if ((currentChunk + " " + sentence).length <= targetSize) {
      currentChunk += (currentChunk ? " " : "") + sentence;
    } else {
      if (currentChunk) chunks.push(currentChunk.trim());

      if (sentence.length > targetSize) {
        let start = 0;
        while (start < sentence.length) {
          const end = Math.min(start + targetSize, sentence.length);
          chunks.push(sentence.slice(start, end).trim());
          start = end - overlap;
        }
        currentChunk = "";
      } else {
        currentChunk = sentence;
      }
    }
  }

  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
}