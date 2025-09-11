import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useVideoCapture } from "@/hooks/useVideoCapture";
import { useDetection } from "@/hooks/useDetection";
import { DetectionResult } from "@/types/proctoring";
import {
  Eye,
  EyeOff,
  Camera,
  CameraOff,
  AlertTriangle,
  Video,
  Square,
  Download,
} from "lucide-react";

interface VideoMonitorProps {
  onDetectionResult: (result: DetectionResult) => void;
  isActive: boolean;
  sessionId?: string;
}

export const VideoMonitor = ({
  onDetectionResult,
  isActive,
  sessionId,
}: VideoMonitorProps) => {
  const {
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
  } = useVideoCapture();
  const {
    isInitialized,
    isDetecting,
    lastResult,
    detectFrame,
    startDetection,
    stopDetection,
  } = useDetection();
  const [detectionInterval, setDetectionInterval] =
    useState<NodeJS.Timeout | null>(null);

  // Auto-upload recording when available and sessionId provided
  useEffect(() => {
    const upload = async () => {
      if (!recordedVideoUrl || !sessionId) return;
      try {
        const response = await fetch(recordedVideoUrl);
        const blob = await response.blob();
        const file = new File([blob], `interview-${sessionId}.webm`, {
          type: "video/webm",
        });
        const { apiService } = await import("@/services/api");
        await apiService.uploadVideo(file, sessionId);
      } catch (e) {
        console.error("Video upload failed:", e);
      }
    };
    upload();
  }, [recordedVideoUrl, sessionId]);

  const handleStartMonitoring = useCallback(async () => {
    await startCapture();
    if (videoRef.current) {
      await startDetection(videoRef.current);
    }
  }, [startCapture, startDetection, videoRef]);

  const handleStopMonitoring = useCallback(() => {
    stopCapture();
    stopDetection();
    if (detectionInterval) {
      clearInterval(detectionInterval);
      setDetectionInterval(null);
    }
  }, [stopCapture, stopDetection, detectionInterval]);

  useEffect(() => {
    if (isActive) {
      handleStartMonitoring();
    } else {
      handleStopMonitoring();
    }
  }, [isActive, handleStartMonitoring, handleStopMonitoring]);

  useEffect(() => {
    if (isStreaming && isDetecting && !detectionInterval) {
      const interval = setInterval(async () => {
        const frame = captureFrame();
        if (frame) {
          try {
            const result = await detectFrame(frame);
            onDetectionResult(result);
          } catch (error) {
            console.error("Detection failed:", error);
          }
        }
      }, 1000); // Detect every second

      setDetectionInterval(interval);
    }

    return () => {
      if (detectionInterval) {
        clearInterval(detectionInterval);
      }
    };
  }, [
    isStreaming,
    isDetecting,
    detectionInterval,
    captureFrame,
    detectFrame,
    onDetectionResult,
  ]);

  const getStatusColor = () => {
    if (!lastResult) return "status-monitoring";
    if (!lastResult.faceDetected) return "status-danger";
    if (lastResult.faceCount > 1) return "status-warning";
    if (lastResult.focusScore < 70) return "status-warning";
    if (lastResult.objectsDetected.length > 0) return "status-danger";
    return "status-safe";
  };

  return (
    <Card className="bg-monitor-panel border-monitor-border shadow-monitor">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Video Monitor
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant={isStreaming ? "default" : "secondary"}>
              {isStreaming ? (
                <Camera className="w-3 h-3 mr-1" />
              ) : (
                <CameraOff className="w-3 h-3 mr-1" />
              )}
              {isStreaming ? "Streaming" : "Offline"}
            </Badge>
            <Badge variant={isDetecting ? "default" : "secondary"}>
              {isDetecting ? (
                <Eye className="w-3 h-3 mr-1" />
              ) : (
                <EyeOff className="w-3 h-3 mr-1" />
              )}
              {isDetecting ? "Detecting" : "Paused"}
            </Badge>
          </div>
        </div>

        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-64 bg-monitor-bg rounded-lg object-cover transform -scale-x-100"
          />

          {/* Detection Overlay */}
          {lastResult && (
            <div className="absolute inset-0 pointer-events-none">
              <div
                className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium bg-${getStatusColor()}/20 text-${getStatusColor()}`}
              >
                {lastResult.faceDetected
                  ? `Face: ${lastResult.faceCount}`
                  : "No Face"}
              </div>

              <div
                className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium bg-${getStatusColor()}/20 text-${getStatusColor()}`}
              >
                Focus: {lastResult.focusScore}%
              </div>

              {lastResult.objectsDetected.length > 0 && (
                <div className="absolute bottom-2 left-2 px-2 py-1 rounded text-xs font-medium bg-status-danger/20 text-status-danger flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {lastResult.objectsDetected.join(", ")}
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-status-danger/10 border border-status-danger/20 rounded-lg">
            <p className="text-sm text-status-danger">{error}</p>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant={isActive ? "destructive" : "default"}
              size="sm"
              onClick={isActive ? handleStopMonitoring : handleStartMonitoring}
            >
              {isActive ? "Stop Monitoring" : "Start Monitoring"}
            </Button>

            {isStreaming && (
              <Button
                variant={isRecording ? "destructive" : "default"}
                size="sm"
                onClick={isRecording ? stopRecording : startRecording}
              >
                {isRecording ? (
                  <>
                    <Square className="w-4 h-4 mr-1" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4 mr-1" />
                    Start Recording
                  </>
                )}
              </Button>
            )}

            {recordedVideoUrl && (
              <Button variant="outline" size="sm" onClick={downloadRecording}>
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
            )}
          </div>

          {lastResult && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                Confidence: {Math.round(lastResult.confidence * 100)}%
              </span>
              {isRecording && (
                <div className="flex items-center gap-1 text-status-danger">
                  <div className="w-2 h-2 bg-status-danger rounded-full animate-pulse" />
                  Recording
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
