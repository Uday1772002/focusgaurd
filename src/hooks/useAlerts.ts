import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

export interface AlertConfig {
  focusLoss: boolean;
  noFace: boolean;
  multipleFaces: boolean;
  phoneDetected: boolean;
  notesDetected: boolean;
  deviceDetected: boolean;
  audioDetection: boolean;
  eyeClosure: boolean;
}

export interface Alert {
  id: string;
  type: string;
  message: string;
  severity: "low" | "medium" | "high";
  timestamp: Date;
  acknowledged: boolean;
}

export const useAlerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [config, setConfig] = useState<AlertConfig>({
    focusLoss: true,
    noFace: true,
    multipleFaces: true,
    phoneDetected: true,
    notesDetected: true,
    deviceDetected: true,
    audioDetection: true,
    eyeClosure: true,
  });

  const alertCooldowns = useRef<Map<string, number>>(new Map());
  const COOLDOWN_DURATION = 5000; // 5 seconds

  const addAlert = useCallback(
    (type: string, message: string, severity: "low" | "medium" | "high") => {
      const now = Date.now();
      const lastAlert = alertCooldowns.current.get(type);

      // Check cooldown to prevent spam
      if (lastAlert && now - lastAlert < COOLDOWN_DURATION) {
        return;
      }

      alertCooldowns.current.set(type, now);

      const alert: Alert = {
        id: `${type}-${now}`,
        type,
        message,
        severity,
        timestamp: new Date(),
        acknowledged: false,
      };

      setAlerts((prev) => [alert, ...prev.slice(0, 49)]); // Keep last 50 alerts

      // Show toast notification
      const toastType =
        severity === "high"
          ? "error"
          : severity === "medium"
          ? "warning"
          : "info";
      toast[toastType](`🚨 ${message}`, {
        description: `Severity: ${severity.toUpperCase()}`,
        duration: severity === "high" ? 10000 : 5000,
      });

      // Play alert sound for high severity
      if (severity === "high") {
        playAlertSound();
      }
    },
    []
  );

  const playAlertSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.5
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn("Could not play alert sound:", error);
    }
  }, []);

  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const updateConfig = useCallback((newConfig: Partial<AlertConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  }, []);

  const getUnacknowledgedCount = useCallback(() => {
    return alerts.filter((alert) => !alert.acknowledged).length;
  }, [alerts]);

  const getAlertsBySeverity = useCallback(
    (severity: "low" | "medium" | "high") => {
      return alerts.filter((alert) => alert.severity === severity);
    },
    [alerts]
  );

  return {
    alerts,
    config,
    addAlert,
    acknowledgeAlert,
    clearAlerts,
    updateConfig,
    getUnacknowledgedCount,
    getAlertsBySeverity,
  };
};
