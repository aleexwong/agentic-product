import { cn } from '../lib/utils';

interface TranscriptPanelProps {
  transcript: string;
  interimTranscript: string;
  detectedWords: string[];
  isListening: boolean;
}

const TRANSCRIPT_TAIL = 220;

export function TranscriptPanel({
  transcript,
  interimTranscript,
  detectedWords,
  isListening,
}: TranscriptPanelProps) {
  const tail = transcript.slice(-TRANSCRIPT_TAIL);
  const recentDetected = detectedWords.slice(-5);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={cn(
            'inline-block h-2.5 w-2.5 rounded-full',
            isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-300',
          )}
        />
        <span className="text-xs font-medium text-gray-600">
          {isListening ? '🎤 Listening…' : '🎤 Paused'}
        </span>
      </div>

      <div className="mt-2 min-h-[3rem] text-sm leading-snug text-gray-700">
        <span>{tail || (isListening ? '' : 'Tap Start Listening to begin.')}</span>{' '}
        <span className="italic text-gray-400">{interimTranscript}</span>
      </div>

      {recentDetected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {recentDetected.map((w, i) => (
            <span
              key={`${w}-${i}`}
              className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
            >
              ✓ {w}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
