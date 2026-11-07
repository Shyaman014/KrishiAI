import { useState, useEffect, useCallback, useRef } from 'react'

export interface UseSpeechOptions {
  language?: 'en' | 'hi' | 'as'
  onTranscript?: (text: string) => void
}

const SPEECH_LANG_CODES: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  as: 'as-IN', // Some browsers fallback gracefully to standard Indian voice
}

// Window augmented interface for speech recognition
interface IWindowSpeech extends Window {
  SpeechRecognition?: {
    new (): ISpeechRecognitionInstance
  }
  webkitSpeechRecognition?: {
    new (): ISpeechRecognitionInstance
  }
}

interface ISpeechRecognitionInstance {
  continuous: boolean
  interimResults: boolean
  lang: string
  onstart: (() => void) | null
  onresult: ((event: ISpeechEvent) => void) | null
  onerror: ((event: ISpeechErrorEvent) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

interface ISpeechEvent {
  results?: Array<Array<{ transcript: string }>>
}

interface ISpeechErrorEvent {
  error: string
}

export function useSpeech(options: UseSpeechOptions = {}) {
  const { language = 'en', onTranscript } = options

  // STT State
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [recognitionError, setRecognitionError] = useState<string | null>(null)
  const [isSttSupported, setIsSttSupported] = useState(false)

  // TTS State
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isTtsSupported, setIsTtsSupported] = useState(false)

  const recognitionRef = useRef<ISpeechRecognitionInstance | null>(null)

  // Check support on mount
  useEffect(() => {
    const win = window as unknown as IWindowSpeech
    const hasSTT = Boolean(win.SpeechRecognition || win.webkitSpeechRecognition)
    setIsSttSupported(hasSTT)
    setIsTtsSupported('speechSynthesis' in window)
  }, [])

  // Start speech-to-text
  const startListening = useCallback(() => {
    const win = window as unknown as IWindowSpeech
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition

    if (!SpeechRecognitionClass) {
      setRecognitionError('Speech recognition is not supported in this browser.')
      return
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }

      const recognition = new SpeechRecognitionClass()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = SPEECH_LANG_CODES[language] || 'en-IN'

      recognition.onstart = () => {
        setIsListening(true)
        setRecognitionError(null)
      }

      recognition.onresult = (event: ISpeechEvent) => {
        const text = event.results?.[0]?.[0]?.transcript || ''
        if (text) {
          setTranscript(text)
          if (onTranscript) {
            onTranscript(text)
          }
        }
      }

      recognition.onerror = (event: ISpeechErrorEvent) => {
        setIsListening(false)
        if (event.error === 'not-allowed') {
          setRecognitionError('Microphone permission was denied. Please allow microphone access.')
        } else if (event.error !== 'no-speech') {
          setRecognitionError(`Speech recognition error: ${event.error}`)
        }
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch {
      setIsListening(false)
      setRecognitionError('Failed to initiate microphone recognition.')
    }
  }, [language, onTranscript])

  // Stop speech-to-text
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }, [])

  // Text-to-speech
  const speak = useCallback(
    (textToSpeak: string, langOverride?: 'en' | 'hi' | 'as') => {
      if (!('speechSynthesis' in window)) return

      window.speechSynthesis.cancel() // Stop any previous speech

      const utterance = new SpeechSynthesisUtterance(textToSpeak)
      const targetLang = langOverride || language
      utterance.lang = SPEECH_LANG_CODES[targetLang] || 'en-IN'
      utterance.rate = 0.95 // Slightly slower for clarity in agricultural terms
      utterance.pitch = 1.0

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      window.speechSynthesis.speak(utterance)
    },
    [language],
  )

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  return {
    // STT
    isListening,
    transcript,
    startListening,
    stopListening,
    recognitionError,
    isSttSupported,
    // TTS
    isSpeaking,
    speak,
    stopSpeaking,
    isTtsSupported,
  }
}
