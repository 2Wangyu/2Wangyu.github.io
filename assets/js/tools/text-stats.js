export function analyzeText(text) {
  const value = String(text ?? "");
  const chineseCharacters = value.match(/\p{Script=Han}/gu)?.length ?? 0;
  const words = value.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g)?.length ?? 0;
  const paragraphs = value.trim()
    ? value.trim().split(/\n\s*\n/).filter((paragraph) => paragraph.trim()).length
    : 0;
  const readingUnits = chineseCharacters / 300 + words / 200;

  return {
    characters: value.length,
    charactersNoSpaces: value.replace(/\s/g, "").length,
    chineseCharacters,
    words,
    paragraphs,
    readingMinutes: readingUnits > 0 ? Math.max(1, Math.ceil(readingUnits)) : 0,
  };
}
