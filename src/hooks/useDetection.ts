import { useState, useCallback, useRef, useEffect } from "react";
import { DetectionResult, ProctoringEvent } from "@/types/proctoring";

export const useDetection = () => {
  // Store loaded COCO-SSD and MediaPipe FaceDetection models in refs
  // Use more specific types for model refs
  const cocoModelRef = useRef<{
    detect: (input: HTMLCanvasElement) => Promise<Array<{ class: string }>>;
  } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const faceDetectionRef = useRef<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [lastResult, setLastResult] = useState<DetectionResult | null>(null);
  const detectionWorkerRef = useRef<Worker | null>(null);

  // Focus tracking state
  const focusHistoryRef = useRef<number[]>([]);
  const lastFocusTimeRef = useRef<Date | null>(null);
  const focusLossStartRef = useRef<Date | null>(null);

  const initializeDetection = useCallback(async () => {
    try {
      console.log("[Detection] Initializing detection models...");
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate loading
      setIsInitialized(true);
      console.log("[Detection] Models initialized.");
    } catch (error) {
      console.error("[Detection] Failed to initialize detection:", error);
    }
  }, []);

  const detectFrame = useCallback(
    async (imageData: ImageData): Promise<DetectionResult> => {
      console.log("[Detection] Processing frame...");
      // Real face detection using MediaPipe
      if (!faceDetectionRef.current) {
        const { FaceDetection } = await import("@mediapipe/face_detection");
        faceDetectionRef.current = new FaceDetection({
          locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
        });
        faceDetectionRef.current.setOptions({
          model: "short",
          minDetectionConfidence: 0.6,
        });
        console.log("[Detection] MediaPipe FaceDetection model loaded.");
      }

      // Convert ImageData to HTMLCanvasElement for MediaPipe
      const canvas = document.createElement("canvas");
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      const ctx = canvas.getContext("2d");
      ctx.putImageData(imageData, 0, 0);
      console.log(
        `[Detection] Canvas dimensions: ${canvas.width}x${canvas.height}`
      );

      // Run face detection and get results
      let detectionResults = null;
      await new Promise((resolve) => {
        faceDetectionRef.current.onResults = (results) => {
          detectionResults = results;
          resolve(null);
        };
        faceDetectionRef.current.send({ image: canvas });
      });
      console.log("[Detection] Face detection results:", detectionResults);

      // Parse face detection results
      let faceCount = 0;
      let faceDetected = false;
      let confidence = 0;
      if (detectionResults && Array.isArray(detectionResults.detections)) {
        faceCount = detectionResults.detections.length;
        faceDetected = faceCount > 0;
        confidence = faceDetected ? detectionResults.detections[0].score : 0;
      }

      // Calculate focus score based on face detection and gaze direction
      let focusScore = 0;
      if (
        faceDetected &&
        detectionResults &&
        Array.isArray(detectionResults.detections)
      ) {
        // Basic focus calculation - in a real implementation, you'd use eye landmarks
        // For now, we'll use face confidence and position as a proxy for focus
        const face = detectionResults.detections[0];
        const faceCenterX = face.locationData.relativeBoundingBox.xCenter;
        const faceCenterY = face.locationData.relativeBoundingBox.yCenter;

        // Check if face is centered (looking at camera)
        const isCentered =
          Math.abs(faceCenterX - 0.5) < 0.2 &&
          Math.abs(faceCenterY - 0.5) < 0.2;
        const confidenceFactor = face.score || 0;

        // Calculate focus score based on centering and confidence
        focusScore = isCentered
          ? Math.round(confidenceFactor * 100)
          : Math.round(confidenceFactor * 60);
      }

      // Track focus history for trend analysis
      focusHistoryRef.current.push(focusScore);
      if (focusHistoryRef.current.length > 10) {
        focusHistoryRef.current.shift();
      }

      // Calculate average focus over last few frames
      const avgFocus =
        focusHistoryRef.current.reduce((sum, score) => sum + score, 0) /
        focusHistoryRef.current.length;

      // Determine if person is looking away based on focus trend
      const isLookingAway = avgFocus < 50;
      const now = new Date();

      if (isLookingAway) {
        if (!focusLossStartRef.current) {
          focusLossStartRef.current = now;
        }
        lastFocusTimeRef.current = now;
      } else {
        focusLossStartRef.current = null;
      }

      // Object detection using TensorFlow.js COCO-SSD
      if (!cocoModelRef.current) {
        const tf = await import("@tensorflow/tfjs");
        // Prefer WebGL backend for better accuracy/performance
        await import("@tensorflow/tfjs-backend-webgl");
        try {
          await tf.setBackend("webgl");
        } catch (e) {
          console.warn(
            "[Detection] WebGL backend unavailable, falling back to CPU."
          );
        }
        await tf.ready();
        // Log selected backend
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        console.log("[Detection] TF backend:", (tf as any).getBackend?.());
        const cocoSsd = await import("@tensorflow-models/coco-ssd");
        cocoModelRef.current = await cocoSsd.load();
        console.log("[Detection] COCO-SSD model loaded.");
      }
      // Get predictions from the canvas
      let predictions: Array<{ class: string }> = [];
      try {
        console.time("[Detection] coco-ssd.detect");
        predictions = await cocoModelRef.current.detect(canvas);
        console.timeEnd("[Detection] coco-ssd.detect");
        const count = predictions ? predictions.length : 0;
        console.log(`[Detection] COCO-SSD raw count: ${count}`);
        if (count > 0) {
          predictions.slice(0, 5).forEach((pred, idx) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const score = "score" in pred ? (pred as any).score : "n/a";
            console.log(`  [${idx}] ${pred.class} (score: ${score})`);
          });
        } else {
          console.log("[Detection] COCO-SSD: No objects in this frame.");
        }
      } catch (err) {
        console.error("[Detection] COCO-SSD detection error:", err);
      }
      // Filter for relevant objects with confidence threshold
      const relevantObjects = [
        "cell phone",
        "mobile phone",
        "phone",
        "book",
        "books",
        "notebook",
        "paper",
        "document",
        "laptop",
        "computer",
        "monitor",
        "screen",
        "tablet",
        "ipad",
        "kindle",
        "headphones",
        "earphones",
        "earbuds",
        "watch",
        "smartwatch",
        "wristwatch",
        "glasses",
        "sunglasses",
      ];

      // Normalize and map labels to canonical types
      const normalizeLabel = (label: string) => {
        const l = label.toLowerCase();
        if (l.includes("cell phone") || l === "phone" || l.includes("mobile"))
          return "phone";
        if (
          l === "book" ||
          l === "books" ||
          l === "notebook" ||
          l === "paper" ||
          l === "document"
        )
          return "notes";
        return label;
      };

      const objectsDetected = predictions
        .filter((pred) => {
          const className = pred.class.toLowerCase();
          const isRelevant = relevantObjects.some((obj) =>
            className.includes(obj)
          );
          // Check if prediction has score property and meets threshold
          const hasConfidence =
            "score" in pred && (pred as { score: number }).score >= 0.3;
          if (isRelevant && hasConfidence) {
            console.log(`[Detection] Relevant object detected: ${className}`);
          }
          return isRelevant && hasConfidence;
        })
        .map((pred) => normalizeLabel(pred.class));

      // Calculate focus loss duration
      const focusLossDuration = focusLossStartRef.current
        ? (now.getTime() - focusLossStartRef.current.getTime()) / 1000
        : 0;

      const detectionResult: DetectionResult = {
        faceDetected,
        faceCount,
        focusScore,
        objectsDetected,
        confidence,
        isLookingAway,
        focusLossDuration:
          focusLossDuration > 0 ? focusLossDuration : undefined,
        eyeClosed: false, // TODO: Implement eye closure detection
        drowsiness: 0, // TODO: Implement drowsiness detection
      };
      setLastResult(detectionResult);
      // No direct backend POST here; the dashboard handles persistence
      return detectionResult;
    },
    []
  );

  const startDetection = useCallback(
    async (videoElement: HTMLVideoElement) => {
      if (!isInitialized) {
        await initializeDetection();
      }
      setIsDetecting(true);
    },
    [isInitialized, initializeDetection]
  );

  const stopDetection = useCallback(() => {
    setIsDetecting(false);
    if (detectionWorkerRef.current) {
      detectionWorkerRef.current.terminate();
    }
  }, []);

  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, [stopDetection]);

  return {
    isInitialized,
    isDetecting,
    lastResult,
    initializeDetection,
    detectFrame,
    startDetection,
    stopDetection,
  };
};
