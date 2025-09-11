import { useState, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { VideoMonitor } from "./VideoMonitor";
import { EventLog } from "./EventLog";
import { ProctoringReport } from "./ProctoringReport";
import { AlertsPanel } from "./AlertsPanel";
import {
  InterviewSession,
  ProctoringEvent,
  DetectionResult,
} from "@/types/proctoring";
import {
  Play,
  Square,
  BarChart3,
  Shield,
  Users,
  Timer,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAudioDetection } from "@/hooks/useAudioDetection";
import { useAlerts } from "@/hooks/useAlerts";
import { apiService } from "@/services/api";

export const ProctoringDashboard = () => {
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [candidateName, setCandidateName] = useState("");
  const [events, setEvents] = useState<ProctoringEvent[]>([]);
  const [showReport, setShowReport] = useState(false);
  const [focusLossStart, setFocusLossStart] = useState<Date | null>(null);
  const [noFaceStart, setNoFaceStart] = useState<Date | null>(null);

  // Audio detection and alerts
  const { isListening, audioResult, startAudioDetection, stopAudioDetection } =
    useAudioDetection();
  const {
    alerts,
    addAlert,
    acknowledgeAlert,
    clearAlerts,
    getUnacknowledgedCount,
  } = useAlerts();

  const calculateIntegrityScore = useCallback((events: ProctoringEvent[]) => {
    let score = 100;
    events.forEach((event) => {
      switch (event.severity) {
        case "high":
          score -= 10;
          break;
        case "medium":
          score -= 5;
          break;
        case "low":
          score -= 2;
          break;
      }
    });
    return Math.max(0, score);
  }, []);

  const addEvent = useCallback(
    (
      type: ProctoringEvent["type"],
      description: string,
      severity: ProctoringEvent["severity"],
      duration?: number
    ) => {
      const newEvent: ProctoringEvent = {
        id: `${Date.now()}-${Math.random()}`,
        type,
        timestamp: new Date(),
        description,
        severity,
        duration,
      };

      setEvents((prev) => {
        const updated = [newEvent, ...prev];

        // Update session with new integrity score
        if (session) {
          setSession({
            ...session,
            events: updated,
            integrityScore: calculateIntegrityScore(updated),
          });
        }

        return updated;
      });

      toast(`⚠️ ${description}`, {
        description: `Severity: ${severity.toUpperCase()}`,
      });

      // Persist to backend if session exists
      if (session?.id) {
        apiService
          .addEvent(session.id, {
            type,
            description,
            severity,
            duration,
          })
          .catch((err) => {
            console.error("Failed to persist event:", err);
          });
      }
    },
    [session, calculateIntegrityScore]
  );

  const handleDetectionResult = useCallback(
    (result: DetectionResult) => {
      const now = new Date();

      // Check for focus loss using enhanced detection
      if (
        result.isLookingAway &&
        result.focusLossDuration &&
        result.focusLossDuration > 5
      ) {
        addEvent(
          "focus_lost",
          `Looking away for ${Math.round(result.focusLossDuration)} seconds`,
          "medium",
          result.focusLossDuration
        );
      }

      // Check for no face
      if (!result.faceDetected) {
        if (!noFaceStart) {
          setNoFaceStart(now);
        } else {
          const duration = (now.getTime() - noFaceStart.getTime()) / 1000;
          if (duration > 10) {
            addEvent(
              "no_face",
              `No face detected for ${Math.round(duration)} seconds`,
              "high",
              duration
            );
            setNoFaceStart(null);
          }
        }
      } else {
        setNoFaceStart(null);
      }

      // Check for multiple faces
      if (result.faceCount > 1) {
        addEvent(
          "multiple_faces",
          `${result.faceCount} faces detected`,
          "high"
        );
      }

      // Check for unauthorized objects
      result.objectsDetected.forEach((object) => {
        switch (object.toLowerCase()) {
          case "phone":
            addEvent(
              "phone_detected",
              "Mobile phone detected in frame",
              "high"
            );
            addAlert(
              "phone_detected",
              "Mobile phone detected in frame",
              "high"
            );
            break;
          case "book":
          case "paper":
            addEvent("notes_detected", "Books or notes detected", "medium");
            addAlert("notes_detected", "Books or notes detected", "medium");
            break;
          default:
            addEvent(
              "device_detected",
              `Unauthorized device detected: ${object}`,
              "medium"
            );
            addAlert(
              "device_detected",
              `Unauthorized device detected: ${object}`,
              "medium"
            );
        }
      });

      // Audio detection alerts
      if (audioResult.backgroundNoise) {
        addAlert("audio_detection", "Background noise detected", "low");
      }
      if (audioResult.multipleVoices) {
        addAlert("audio_detection", "Multiple voices detected", "high");
        addEvent(
          "device_detected",
          "Multiple voices detected - possible unauthorized person",
          "high"
        );
      }
    },
    [focusLossStart, noFaceStart, addEvent, addAlert, audioResult]
  );

  const startSession = useCallback(async () => {
    if (!candidateName.trim()) {
      toast.error("Please enter candidate name");
      return;
    }
    try {
      const created = await apiService.createSession(candidateName.trim());
      const newSession: InterviewSession = {
        id: created.id,
        candidateName: created.candidateName,
        startTime: new Date(created.startTime),
        endTime: created.endTime ? new Date(created.endTime) : undefined,
        events: [],
        integrityScore: created.integrityScore,
        status: created.status,
      };
      setSession(newSession);
      setEvents([]);
      toast.success("Interview session started", {
        description: `Monitoring ${candidateName}`,
      });
    } catch (e) {
      toast.error("Failed to start session");
      console.error(e);
    }
  }, [candidateName]);

  const endSession = useCallback(async () => {
    if (!session) return;
    try {
      const ended = await apiService.endSession(session.id);
      setSession({
        ...session,
        endTime: ended.endTime ? new Date(ended.endTime) : new Date(),
        status: "completed",
      });
      toast.success("Interview session ended");
    } catch (e) {
      toast.error("Failed to end session");
      console.error(e);
    }
  }, [session]);

  const clearLog = useCallback(() => {
    setEvents([]);
    if (session) {
      setSession({
        ...session,
        events: [],
        integrityScore: 100,
      });
    }
    toast.info("Event log cleared");
  }, [session]);

  const exportLog = useCallback(() => {
    const data = JSON.stringify({ session, events }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proctoring-log-${
      session?.candidateName || "unknown"
    }-${format(new Date(), "yyyy-MM-dd-HH-mm")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Log exported successfully");
  }, [session, events]);

  return (
    <div className="min-h-screen bg-monitor-bg p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            Video Proctoring System
          </h1>
          <p className="text-muted-foreground">
            Real-time monitoring and integrity assessment for online interviews
          </p>
        </div>

        {/* Session Control */}
        <Card className="bg-monitor-panel border-monitor-border shadow-monitor mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="candidateName">Candidate Name</Label>
                    <Input
                      id="candidateName"
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      placeholder="Enter candidate name"
                      disabled={!!session}
                      className="bg-monitor-bg"
                    />
                  </div>
                  <div className="flex items-end">
                    {!session ? (
                      <Button onClick={startSession} className="w-full">
                        <Play className="w-4 h-4 mr-2" />
                        Start Session
                      </Button>
                    ) : (
                      <Button
                        onClick={endSession}
                        variant="destructive"
                        disabled={session.status === "completed"}
                      >
                        <Square className="w-4 h-4 mr-2" />
                        End Session
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {session && (
                  <>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        Session Status
                      </div>
                      <Badge
                        variant={
                          session.status === "active" ? "default" : "secondary"
                        }
                      >
                        {session.status}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        Integrity Score
                      </div>
                      <div
                        className={`text-xl font-bold ${
                          session.integrityScore >= 90
                            ? "text-status-safe"
                            : session.integrityScore >= 70
                            ? "text-status-warning"
                            : "text-status-danger"
                        }`}
                      >
                        {session.integrityScore}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        Alerts
                      </div>
                      <Badge
                        variant={
                          getUnacknowledgedCount() > 0
                            ? "destructive"
                            : "outline"
                        }
                      >
                        {getUnacknowledgedCount()}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowReport(!showReport)}
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      {showReport ? "Hide" : "Show"} Report
                    </Button>
                  </>
                )}
              </div>
            </div>

            {session && (
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {session.candidateName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Timer className="w-4 h-4" />
                    Started: {format(session.startTime, "HH:mm:ss")}
                  </span>
                  {session.endTime && (
                    <span className="flex items-center gap-1">
                      Ended: {format(session.endTime, "HH:mm:ss")}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={
                      isListening ? stopAudioDetection : startAudioDetection
                    }
                  >
                    {isListening ? (
                      <VolumeX className="w-4 h-4 mr-1" />
                    ) : (
                      <Volume2 className="w-4 h-4 mr-1" />
                    )}
                    {isListening ? "Stop Audio" : "Start Audio"}
                  </Button>

                  {isListening && (
                    <div className="flex items-center gap-2 text-sm">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          audioResult.isSpeaking
                            ? "bg-status-safe"
                            : "bg-muted-foreground"
                        }`}
                      />
                      <span>Volume: {audioResult.volume}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Report */}
        {showReport && session && (
          <div className="mb-6">
            <ProctoringReport session={session} />
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Video Monitor */}
          <div className="lg:col-span-2">
            <VideoMonitor
              onDetectionResult={handleDetectionResult}
              isActive={session?.status === "active"}
              sessionId={session?.id}
            />
          </div>

          {/* Event Log */}
          <div>
            <EventLog
              events={events}
              onClearLog={clearLog}
              onExportLog={exportLog}
            />
          </div>

          {/* Alerts Panel */}
          <div>
            <AlertsPanel
              alerts={alerts}
              onAcknowledge={acknowledgeAlert}
              onClear={clearAlerts}
              unacknowledgedCount={getUnacknowledgedCount()}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
