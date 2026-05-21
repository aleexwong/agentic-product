import OpenAI from 'openai';

// Inline Vercel Node.js handler types — avoids adding @vercel/node to deps
type Req = {
  method?: string;
  body: unknown;
};
type Res = {
  status: (code: number) => Res;
  json: (data: unknown) => void;
};

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!client) {
    // Key not configured — return empty match list so the game still works
    return res.status(503).json({ error: 'LLM not configured', matches: [] });
  }

  const body = req.body as Record<string, unknown>;
  const transcript = typeof body?.transcript === 'string' ? body.transcript : '';
  const candidates = Array.isArray(body?.candidates)
    ? (body.candidates as string[]).filter((c): c is string => typeof c === 'string')
    : [];

  if (!transcript.trim() || candidates.length === 0) {
    return res.json([]);
  }

  // Truncate to prevent runaway tokens
  const safeTranscript = transcript.slice(0, 2000);

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You analyze meeting transcripts to find corporate buzzwords. ' +
            'Return only a JSON array of matched buzzwords from the provided list. ' +
            'Never include words not in the list. If none match, return [].',
        },
        {
          role: 'user',
          content: JSON.stringify({ transcript: safeTranscript, candidates }),
        },
      ],
    });

    const text = response.choices[0]?.message?.content?.trim() ?? '';
    const jsonText = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    const parsed: unknown = JSON.parse(jsonText);
    if (!Array.isArray(parsed)) return res.json([]);

    const candidateSet = new Set(candidates.map((w) => w.toLowerCase()));
    const matches = parsed.filter(
      (item): item is string =>
        typeof item === 'string' && candidateSet.has(item.toLowerCase()),
    );

    return res.json(matches);
  } catch (err) {
    console.error('[llm-match] OpenAI call failed:', err instanceof Error ? err.message : err);
    return res.status(502).json({ error: 'LLM call failed', matches: [] });
  }
}
