import { useRef, useCallback, useEffect, useState } from "react";

// Debug flag to control console logging
const DEBUG_ENABLED = false;

// Utility function for conditional logging
const debugLog = (type: "log" | "warn" | "error", ...args: unknown[]) => {
  if (DEBUG_ENABLED) {
    console[type](...args);
  }
};

export const useVideoCapture = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);

  // Define stopRecording before it's used in other functions
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      setIsRecording(false);
    }
  }, [isRecording]);

  const startCapture = useCallback(async () => {
    // Clear any previous errors when attempting to start capture
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      setError("Failed to access camera. Please check permissions.");
      debugLog("error", "Error accessing camera:", err);
    }
  }, []);

  const stopCapture = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    stopRecording();
  }, [stopRecording]);

  const startRecording = useCallback(() => {
    if (!streamRef.current || isRecording) return;

    try {
      recordedChunksRef.current = [];

      // Check browser compatibility for various codecs
      let options = {};
      const mimeTypes = [
        "video/webm;codecs=vp9",
        "video/webm;codecs=vp8",
        "video/webm",
        "video/mp4",
      ];

      // Find the first supported MIME type
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          options = { mimeType };
          debugLog("log", `Using supported recording format: ${mimeType}`);
          break;
        }
      }

      const mediaRecorder = new MediaRecorder(streamRef.current, options);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Record in 1-second chunks
      setIsRecording(true);
    } catch (error) {
      debugLog("error", "Error starting recording:", error);
      setError("Failed to start recording");
    }
  }, [isRecording]);

  const downloadRecording = useCallback(() => {
    if (recordedVideoUrl) {
      const a = document.createElement("a");
      a.href = recordedVideoUrl;
      a.download = `interview-recording-${new Date()
        .toISOString()
        .slice(0, 19)}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }, [recordedVideoUrl]);

  const captureFrame = useCallback((): ImageData | null => {
    if (!videoRef.current || !isStreaming) return null;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);

    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }, [isStreaming]);

  useEffect(() => {
    return () => {
      stopCapture();
    };
  }, [stopCapture]);

  return {
    videoRef,
    isStreaming,
    isRecording,
    error,
    recordedVideoUrl,
    startCapture,
    stopCapture,
    startRecording,
    stopRecording,
    downloadRecording,
    captureFrame,
  };
};
