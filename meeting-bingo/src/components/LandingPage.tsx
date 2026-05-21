import { Button } from './ui/Button';

interface LandingPageProps {
  onStart: () => void;
}

const HOW_IT_WORKS = [
  { icon: '🎯', text: 'Pick a buzzword category' },
  { icon: '🎤', text: 'Enable your microphone' },
  { icon: '👥', text: 'Join your meeting' },
  { icon: '✨', text: 'Watch squares fill themselves' },
];

export function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mb-3 text-5xl" aria-hidden="true">
        🎯
      </div>
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
        Turn any meeting into a game
      </h1>
      <p className="mt-4 max-w-lg text-lg text-gray-600">
        Auto-detects buzzwords using speech recognition.
      </p>

      <Button size="lg" className="mt-8 min-h-[52px] w-full max-w-xs" onClick={onStart}>
        New Game
      </Button>

      <p className="mt-4 text-sm text-gray-500">
        🔒 Audio processed locally. Never recorded.
      </p>

      <section className="mt-16 w-full">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
          How it works
        </h2>
        <ol className="mt-4 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
          {HOW_IT_WORKS.map((step, i) => (
            <li
              key={step.text}
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 text-left text-sm text-gray-700 shadow-sm"
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <span className="text-xl" aria-hidden="true">
                {step.icon}
              </span>
              <span>{step.text}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
