import { useCallback, useEffect, useRef, useState } from "react";

export interface AudioDetectionResult {
  isSpeaking: boolean;
  volume: number;
  backgroundNoise: boolean;
  multipleVoices: boolean;
}

interface AudioThresholds {
  speakingVolume: number;
  backgroundNoiseEnergy: number;
  multipleVoicesEnergy: number;
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

  // Configurable thresholds with sane defaults
  const [thresholds, setThresholds] = useState<AudioThresholds>({
    speakingVolume: 20,
    backgroundNoiseEnergy: 100,
    multipleVoicesEnergy: 180,
  });

  const calibrate = useCallback(async (durationMs = 2000) => {
    if (!analyserRef.current) return;
    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const endTime = performance.now() + durationMs;
    let peak = 0;
    let noiseSum = 0;
    let samples = 0;

    while (performance.now() < endTime) {
      analyser.getByteFrequencyData(dataArray);
      const total = dataArray.reduce((a, b) => a + b, 0);
      const max = Math.max(...dataArray);
      peak = Math.max(peak, max);
      noiseSum += total;
      samples += 1;
      await new Promise((r) => setTimeout(r, 50));
    }

    const avgNoise = samples > 0 ? noiseSum / samples : 0;

    setThresholds({
      speakingVolume: Math.max(25, Math.round(peak * 0.6)),
      backgroundNoiseEnergy: Math.round(avgNoise * 1.2),
      multipleVoicesEnergy: Math.round(avgNoise * 1.8),
    });
  }, []);

  const startAudioDetection = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const microphone = audioContext.createMediaStreamSource(stream);
      microphoneRef.current = microphone;
      microphone.connect(analyser);

      setIsListening(true);
      setError(null);

      // Optional quick calibration on start
      calibrate(1200);

      analyzeAudio();
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Failed to access microphone. Please check permissions.");
    }
  }, [calibrate]);

  const stopAudioDetection = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
      microphoneRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsListening(false);
  }, []);

  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current) return;
    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const loop = () => {
      analyser.getByteFrequencyData(dataArray);
      const totalEnergy = dataArray.reduce((a, b) => a + b, 0);
      const peak = Math.max(...dataArray);

      // Split bands coarsely
      const third = Math.floor(dataArray.length / 3);
      const low = dataArray.slice(0, third).reduce((a, b) => a + b, 0);
      const mid = dataArray.slice(third, third * 2).reduce((a, b) => a + b, 0);
      const high = dataArray.slice(third * 2).reduce((a, b) => a + b, 0);

      const isSpeaking = peak > thresholds.speakingVolume;
      const backgroundNoise = totalEnergy > thresholds.backgroundNoiseEnergy;
      const multipleVoices =
        high + mid > thresholds.multipleVoicesEnergy &&
        peak > thresholds.speakingVolume;

      setAudioResult({
        isSpeaking,
        volume: peak,
        backgroundNoise,
        multipleVoices,
      });

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    loop();
  }, [thresholds]);

  useEffect(() => {
    return () => {
      stopAudioDetection();
    };
  }, [stopAudioDetection]);

  return {
    isListening,
    audioResult,
    error,
    thresholds,
    setThresholds,
    calibrate,
    startAudioDetection,
    stopAudioDetection,
  };
};
