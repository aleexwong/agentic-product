import { useCallback, useEffect, useRef, useState } from 'react';

/** Public API surface returned by useSpeechRecognition. */
export interface UseSpeechRecognitionApi {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  startListening(onResult?: (finalTranscript: string) => void): void;
  stopListening(): void;
  resetTranscript(): void;
}

function getRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

/** Wraps the Web Speech API with auto-restart on end, interim results, and Strict Mode safety via shouldListenRef. */
export function useSpeechRecognition(): UseSpeechRecognitionApi {
  const RecognitionCtor = getRecognitionCtor();
  const isSupported = RecognitionCtor !== null;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldListenRef = useRef(false);
  const onResultRef = useRef<((finalTranscript: string) => void) | undefined>(undefined);

  // Lazy-init the recognition object once.
  useEffect(() => {
    if (!RecognitionCtor) return;
    const recognition = new RecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalChunk = '';
      let interimChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          finalChunk += text + ' ';
        } else {
          interimChunk += text;
        }
      }
      if (finalChunk) {
        setTranscript((prev) => (prev + ' ' + finalChunk).trim().slice(-2000));
        if (onResultRef.current) onResultRef.current(finalChunk.trim());
      }
      setInterimTranscript(interimChunk);
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      // Stop auto-restart on network loss to prevent a rapid restart loop
      if (event.error === 'network') shouldListenRef.current = false;
      setError(event.error || 'Speech recognition error');
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
      // shouldListenRef toggles outside the setState updater (change #9).
      if (shouldListenRef.current) {
        try {
          recognition.start();
          setIsListening(true);
        } catch {
          // start() throws if already started; safe to swallow.
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      shouldListenRef.current = false;
      try {
        recognition.stop();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    };
  }, [RecognitionCtor]);

  const startListening = useCallback((onResult?: (finalTranscript: string) => void) => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    onResultRef.current = onResult;
    shouldListenRef.current = true;
    setError(null);
    try {
      recognition.start();
      setIsListening(true);
    } catch {
      // already started — ignore
    }
  }, []);

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    shouldListenRef.current = false;
    if (!recognition) return;
    try {
      recognition.stop();
    } catch {
      /* ignore */
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
