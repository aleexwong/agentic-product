const WORD_ALIASES: Record<string, readonly string[]> = {
  'ci/cd': ['ci cd', 'cicd', 'continuous integration', 'continuous delivery'],
  mvp: ['minimum viable product', 'm.v.p.', 'm v p'],
  roi: ['return on investment', 'r.o.i.', 'r o i'],
  api: ['a.p.i.', 'a p i'],
  devops: ['dev ops', 'dev-ops'],
  'a/b test': ['a b test', 'ab test', 'a slash b test'],
  sla: ['s.l.a.', 's l a', 'service level agreement'],
  // Inflected multi-word forms people commonly say differently
  'move the needle': ['moving the needle'],
  'circle back': ['circling back'],
  'touch base': ['touching base', 'touch bases'],
  'deep dive': ['deep diving'],
  'drill down': ['drilling down'],
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/-/g, ' ') // speech recognition never outputs hyphens
    .replace(/\s+/g, ' ')
    .trim();
}

// Covers common regular English inflections: plurals, gerunds, past tense, comparatives
const INFLECTION_SUFFIX = '(?:s|es|ing|ed|er|ers|d|ly)?';

function buildPattern(word: string): RegExp {
  const target = normalizeText(word);
  const rawAliases = WORD_ALIASES[target] ?? [];
  // Normalize alias values so hyphens and casing are consistent with the transcript
  const candidates = [target, ...rawAliases.map(normalizeText)];

  const parts = candidates.map((candidate) => {
    const escaped = escapeRegex(candidate);
    // Plain single words get inflection suffix; phrases and special-char tokens get exact boundary match
    if (/^[a-z0-9]+$/.test(candidate)) {
      return `\\b${escaped}${INFLECTION_SUFFIX}\\b`;
    }
    return `\\b${escaped}\\b`;
  });

  return new RegExp(parts.join('|'), 'i');
}

/** Scans a speech transcript for bingo words, matching common aliases (e.g. "CI/CD" → "cicd") and inflected forms (e.g. "refactoring" → "Refactor"). Returns matched words not already filled. */
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
    if (buildPattern(word).test(normalizedTranscript)) {
      detected.push(word);
    }
  }
  return detected;
}
