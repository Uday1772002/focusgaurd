import { useRef, useCallback, useState, useEffect } from "react";

export interface AudioDetectionResult {
  isSpeaking: boolean;
  volume: number;
  backgroundNoise: boolean;
  multipleVoices: boolean;
}

export const useAudioDetection = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioResult, setAudioResult] = useState<AudioDetectionResult>({
    isSpeaking: false,
    volume: 0,
    backgroundNoise: false,
    multipleVoices: false,
  });

  const startAudioDetection = useCallback(async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      // Create audio context
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      // Create analyser node
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      // Create microphone source
      const microphone = audioContext.createMediaStreamSource(stream);
      microphoneRef.current = microphone;
      microphone.connect(analyser);

      setIsListening(true);
      setError(null);

      // Start audio analysis
      analyzeAudio();
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Failed to access microphone. Please check permissions.");
    }
  }, []);

  const stopAudioDetection = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    microphoneRef.current = null;
    analyserRef.current = null;
    setIsListening(false);
  }, []);

  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const analyze = () => {
      analyser.getByteFrequencyData(dataArray);

      // Calculate volume (RMS)
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const volume = Math.sqrt(sum / bufferLength);

      // Determine if speaking (volume threshold)
      const isSpeaking = volume > 20;

      // Detect background noise (high frequency content)
      const highFreqSum = dataArray
        .slice(bufferLength * 0.7)
        .reduce((a, b) => a + b, 0);
      const backgroundNoise = highFreqSum > 100;

      // Simple multiple voice detection (frequency distribution analysis)
      const midFreqSum = dataArray
        .slice(bufferLength * 0.3, bufferLength * 0.7)
        .reduce((a, b) => a + b, 0);
      const lowFreqSum = dataArray
        .slice(0, bufferLength * 0.3)
        .reduce((a, b) => a + b, 0);
      const multipleVoices =
        Math.abs(midFreqSum - lowFreqSum) > 50 && volume > 15;

      setAudioResult({
        isSpeaking,
        volume: Math.round(volume),
        backgroundNoise,
        multipleVoices,
      });

      animationFrameRef.current = requestAnimationFrame(analyze);
    };

    analyze();
  }, []);

  useEffect(() => {
    return () => {
      stopAudioDetection();
    };
  }, [stopAudioDetection]);

  return {
    isListening,
    error,
    audioResult,
    startAudioDetection,
    stopAudioDetection,
  };
};
