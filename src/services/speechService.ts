// ──────────────────────────────────────────────
// BodyFuel AI — Speech Recognition Service
// ──────────────────────────────────────────────

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

class SpeechService {
  private recognition: SpeechRecognitionInstance | null = null;
  private isListening = false;

  private getSpeechRecognitionClass(): any | null {
    if (typeof window !== 'undefined') {
      return window.SpeechRecognition || window.webkitSpeechRecognition;
    }
    return null;
  }

  /**
   * Check whether the Web Speech API is available in this browser.
   */
  isSupported(): boolean {
    return !!this.getSpeechRecognitionClass();
  }

  /**
   * Begin capturing speech.
   *
   * @param onResult  — called with the recognised transcript (interim + final)
   * @param onError   — called when recognition encounters an error
   */
  startListening(
    onResult: (text: string) => void,
    onError: (err: string) => void,
  ): void {
    if (!this.isSupported()) {
      onError('Speech recognition is not supported in this browser.');
      return;
    }

    // Reuse or create a fresh instance
    if (!this.recognition) {
      const SpeechRecognitionCtor =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognitionCtor() as SpeechRecognitionInstance;
    }

    const rec = this.recognition;

    // Configure
    rec.lang = 'hi-IN'; // primary — Hindi (India)
    rec.continuous = false;
    rec.interimResults = true;

    // Event handlers
    rec.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        transcript += result[0].transcript;
      }

      if (transcript.trim()) {
        onResult(transcript.trim());
      }
    };

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      // If Hindi fails, retry with English (India) once
      if (
        event.error === 'language-not-supported' ||
        event.error === 'not-allowed'
      ) {
        if (rec.lang === 'hi-IN') {
          rec.lang = 'en-IN';
          try {
            rec.start();
            return;
          } catch {
            // fall through to error callback
          }
        }
      }

      this.isListening = false;

      const messages: Record<string, string> = {
        'no-speech': 'No speech detected. Please try again.',
        'audio-capture': 'Microphone not found. Please check your device.',
        'not-allowed': 'Microphone access denied. Please allow microphone permissions.',
        'network': 'Network error occurred. Please check your connection.',
        'aborted': 'Speech recognition was aborted.',
        'language-not-supported': 'Language not supported. Please try speaking in English.',
      };

      onError(messages[event.error] || `Speech recognition error: ${event.error}`);
    };

    rec.onend = () => {
      this.isListening = false;
    };

    // Start
    try {
      rec.start();
      this.isListening = true;
    } catch (err) {
      onError(
        `Failed to start speech recognition: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /**
   * Stop an active recognition session.
   */
  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }
}

/** Singleton speech-service instance. */
export const speechService = new SpeechService();
