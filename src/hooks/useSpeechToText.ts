import { useState, useEffect, useRef, useCallback } from 'react';

// Web Speech API interface declarations for TypeScript compatibility
interface SpeechRecognitionEventLike extends Event {
    resultIndex: number;
    results: {
        length: number;
        item(index: number): {
            isFinal: boolean;
            length: number;
            item(index: number): {
                transcript: string;
                confidence: number;
            };
            [index: number]: {
                transcript: string;
                confidence: number;
            };
        };
        [index: number]: {
            isFinal: boolean;
            length: number;
            [index: number]: {
                transcript: string;
                confidence: number;
            };
        };
    };
}

interface SpeechRecognitionErrorEventLike extends Event {
    error: string;
    message?: string;
}

interface SpeechRecognitionInstance extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    maxAlternatives: number;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onstart: (() => void) | null;
    onend: (() => void) | null;
    onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
    onresult: ((event: SpeechRecognitionEventLike) => void) | null;
}

interface SpeechRecognitionConstructor {
    new (): SpeechRecognitionInstance;
}

declare global {
    interface Window {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
        webkitAudioContext?: typeof AudioContext;
    }
}

export interface UseSpeechToTextOptions {
    onFinalResult?: (transcript: string) => void;
    onInterimResult?: (transcript: string) => void;
}

export function useSpeechToText(options: UseSpeechToTextOptions = {}) {
    const [isListening, setIsListening] = useState(false);
    const [interimTranscript, setInterimTranscript] = useState('');
    const [audioLevel, setAudioLevel] = useState(0); // 0 to 100
    const [error, setError] = useState<string | null>(null);
    const [isSupported, setIsSupported] = useState(false);

    const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
    const isListeningRef = useRef(false);
    const isManualStopRef = useRef(false);
    const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Audio Analysis Refs
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animFrameRef = useRef<number | null>(null);

    // Keep callback refs fresh without re-triggering effects
    const onFinalResultRef = useRef(options.onFinalResult);
    const onInterimResultRef = useRef(options.onInterimResult);

    useEffect(() => {
        onFinalResultRef.current = options.onFinalResult;
        onInterimResultRef.current = options.onInterimResult;
    }, [options.onFinalResult, options.onInterimResult]);

    // Check browser support on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const hasSpeech = Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
            setIsSupported(hasSpeech);
        }
    }, []);

    // Stop and cleanup Web Audio API
    const stopAudioMeter = useCallback(() => {
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
            animFrameRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => {
                try {
                    track.stop();
                } catch {
                    // Ignore track stop errors
                }
            });
            mediaStreamRef.current = null;
        }
        if (audioContextRef.current) {
            try {
                audioContextRef.current.close();
            } catch {
                // Ignore context close errors
            }
            audioContextRef.current = null;
        }
        analyserRef.current = null;
        setAudioLevel(0);
    }, []);

    // Start Web Audio API to calculate live microphone volume
    const startAudioMeter = useCallback(async () => {
        if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;

        try {
            // Clean up any existing instances first
            stopAudioMeter();

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            mediaStreamRef.current = stream;

            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;

            const ctx = new AudioCtx();
            audioContextRef.current = ctx;

            if (ctx.state === 'suspended') {
                await ctx.resume();
            }

            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.4;
            source.connect(analyser);
            analyserRef.current = analyser;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const updateMeter = () => {
                if (!analyserRef.current || !isListeningRef.current) return;

                analyserRef.current.getByteFrequencyData(dataArray);

                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    sum += dataArray[i];
                }

                const avg = sum / dataArray.length;
                // Normalize 0..128 to 0..100 percentage with exponential boost for voice sensitivity
                const normalized = Math.min(100, Math.round(Math.pow(avg / 96, 1.2) * 100));
                setAudioLevel(normalized);

                animFrameRef.current = requestAnimationFrame(updateMeter);
            };

            updateMeter();
        } catch (err) {
            console.warn('Could not start microphone audio level meter:', err);
        }
    }, [stopAudioMeter]);

    // Create and start a fresh SpeechRecognition session
    const createAndStartRecognition = useCallback(() => {
        if (typeof window === 'undefined') return;
        if (!isListeningRef.current || isManualStopRef.current) return;

        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRec) return;

        // Abort previous session if still bound
        if (recognitionRef.current) {
            try {
                recognitionRef.current.abort();
            } catch {
                // Ignore
            }
            recognitionRef.current = null;
        }

        const recognition = new SpeechRec();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
            isListeningRef.current = true;
            setError(null);
        };

        recognition.onresult = (event: SpeechRecognitionEventLike) => {
            let currentInterim = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const result = event.results[i];
                const transcript = result[0]?.transcript || '';

                if (result.isFinal) {
                    const finalPhrase = transcript.trim();
                    if (finalPhrase) {
                        onFinalResultRef.current?.(finalPhrase);
                    }
                    setInterimTranscript('');
                } else {
                    currentInterim += transcript;
                }
            }

            if (currentInterim) {
                setInterimTranscript(currentInterim);
                onInterimResultRef.current?.(currentInterim);
            }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
            // 'no-speech' and 'aborted' are normal lifecycle events in Chrome when pausing or restarting
            if (event.error === 'no-speech' || event.error === 'aborted') {
                return;
            }

            if (event.error === 'not-allowed') {
                setError('Microphone permission was denied. Please allow microphone access in your browser settings.');
                isManualStopRef.current = true;
                setIsListening(false);
                isListeningRef.current = false;
                stopAudioMeter();
                return;
            }

            console.warn('Speech recognition status:', event.error);
        };

        recognition.onend = () => {
            // Resilient auto-restart: if user didn't stop listening, restart immediately with a fresh instance
            if (isListeningRef.current && !isManualStopRef.current) {
                if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
                restartTimerRef.current = setTimeout(() => {
                    if (isListeningRef.current && !isManualStopRef.current) {
                        createAndStartRecognition();
                    }
                }, 100);
            } else {
                setIsListening(false);
                isListeningRef.current = false;
                setInterimTranscript('');
                stopAudioMeter();
            }
        };

        recognitionRef.current = recognition;

        try {
            recognition.start();
        } catch (err) {
            console.warn('Recognition start exception, retrying...', err);
            if (isListeningRef.current && !isManualStopRef.current) {
                if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
                restartTimerRef.current = setTimeout(() => {
                    createAndStartRecognition();
                }, 200);
            }
        }
    }, [stopAudioMeter]);

    const startListening = useCallback(() => {
        if (!isSupported) return;
        setError(null);
        isManualStopRef.current = false;
        isListeningRef.current = true;
        setIsListening(true);

        // Start real-time audio volume visualizer
        startAudioMeter();

        // Start speech recognition instance
        createAndStartRecognition();
    }, [isSupported, startAudioMeter, createAndStartRecognition]);

    const stopListening = useCallback(() => {
        isManualStopRef.current = true;
        isListeningRef.current = false;

        if (restartTimerRef.current) {
            clearTimeout(restartTimerRef.current);
            restartTimerRef.current = null;
        }

        if (recognitionRef.current) {
            try {
                recognitionRef.current.abort();
            } catch {
                // Ignore
            }
            recognitionRef.current = null;
        }

        stopAudioMeter();
        setIsListening(false);
        setInterimTranscript('');
    }, [stopAudioMeter]);

    const toggleListening = useCallback(() => {
        if (isListeningRef.current) {
            stopListening();
        } else {
            startListening();
        }
    }, [startListening, stopListening]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isManualStopRef.current = true;
            isListeningRef.current = false;
            if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort();
                } catch {
                    // Ignore
                }
            }
            stopAudioMeter();
        };
    }, [stopAudioMeter]);

    return {
        isListening,
        isSupported,
        interimTranscript,
        audioLevel,
        error,
        startListening,
        stopListening,
        toggleListening,
        clearError: () => setError(null)
    };
}
