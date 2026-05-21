/**
 * Calls the /api/llm-match serverless proxy — the OpenAI key lives there,
 * never in the browser bundle.
 */
export async function llmMatchWords(
  transcript: string,
  candidates: readonly string[],
): Promise<string[]> {
  if (candidates.length === 0 || transcript.trim().length === 0) return [];

  const res = await fetch('/api/llm-match', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript, candidates }),
  });

  if (!res.ok) throw new Error(`llm-match responded ${res.status}`);

  const data: unknown = await res.json();
  if (!Array.isArray(data)) return [];

  const candidateSet = new Set(candidates.map((w) => w.toLowerCase()));
  return data.filter(
    (item): item is string =>
      typeof item === 'string' && candidateSet.has(item.toLowerCase()),
  );
}

// Non-secret feature flag — set VITE_LLM_ENABLED=true in .env to enable LLM matching
export const llmEnabled = import.meta.env.VITE_LLM_ENABLED === 'true';
