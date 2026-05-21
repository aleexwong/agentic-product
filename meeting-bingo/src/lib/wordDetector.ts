const WORD_ALIASES: Record<string, readonly string[]> = {
  'ci/cd': ['ci cd', 'cicd', 'continuous integration', 'continuous delivery'],
  mvp: ['minimum viable product', 'm.v.p.', 'm v p'],
  roi: ['return on investment', 'r.o.i.', 'r o i'],
  api: ['a.p.i.', 'a p i'],
  devops: ['dev ops', 'dev-ops'],
  'a/b test': ['a b test', 'ab test', 'a slash b test'],
  sla: ['s.l.a.', 's l a', 'service level agreement'],
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchesWord(transcript: string, word: string): boolean {
  const target = normalizeText(word);
  const candidates = [target, ...(WORD_ALIASES[target] ?? [])];

  for (const candidate of candidates) {
    if (candidate.includes(' ') || /[^a-z0-9]/.test(candidate)) {
      if (transcript.includes(candidate)) return true;
    } else {
      const re = new RegExp(`\\b${escapeRegex(candidate)}\\b`, 'i');
      if (re.test(transcript)) return true;
    }
  }
  return false;
}

export function detectWordsWithAliases(
  transcript: string,
  cardWords: readonly string[],
  alreadyFilled: ReadonlySet<string>,
): string[] {
  const normalizedTranscript = normalizeText(transcript);
  const detected: string[] = [];

  for (const word of cardWords) {
    if (alreadyFilled.has(word.toLowerCase())) continue;
    if (word === 'FREE') continue;
    if (matchesWord(normalizedTranscript, word)) {
      detected.push(word);
    }
  }
  return detected;
}
