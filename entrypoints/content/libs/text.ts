export function stripPunctuation(text: string): string {
  return text.replace(/[。、！？.!?,\s・「」『』（）()【】\[\]]/g, "");
}

export function isTextGrowing(oldText: string, newText: string): boolean {
  const oldStripped = stripPunctuation(oldText);
  const newStripped = stripPunctuation(newText);

  if (newStripped.length <= oldStripped.length) return false;

  if (newStripped.startsWith(oldStripped)) return true;

  const checkLen = Math.max(5, Math.floor(oldStripped.length * 0.8));
  if (newStripped.slice(0, checkLen) === oldStripped.slice(0, checkLen)) {
    return true;
  }

  let matchCount = 0;
  const compareLen = Math.min(oldStripped.length, newStripped.length);
  for (let i = 0; i < compareLen; i++) {
    if (oldStripped[i] === newStripped[i]) matchCount++;
  }
  if (matchCount >= oldStripped.length * 0.9) {
    return true;
  }

  return false;
}

export function isSimilarText(text1: string, text2: string): boolean {
  const s1 = stripPunctuation(text1);
  const s2 = stripPunctuation(text2);

  if (s1 === s2) return true;

  if (s1.includes(s2) || s2.includes(s1)) return true;

  const shorter = s1.length <= s2.length ? s1 : s2;
  const longer = s1.length > s2.length ? s1 : s2;
  if (shorter.length > 5) {
    let matchCount = 0;
    for (let i = 0; i < shorter.length; i++) {
      if (shorter[i] === longer[i]) matchCount++;
    }
    if (matchCount >= shorter.length * 0.9) return true;
  }

  return false;
}
