export interface ProctoringEvent {
  id: string;
  type:
    | "focus_lost"
    | "no_face"
    | "multiple_faces"
    | "phone_detected"
    | "notes_detected"
    | "device_detected";
  timestamp: Date;
  description: string;
  severity: "low" | "medium" | "high";
  duration?: number; // in seconds
}

export interface DetectionResult {
  faceDetected: boolean;
  faceCount: number;
  focusScore: number; // 0-100
  objectsDetected: string[];
  confidence: number;
  isLookingAway: boolean;
  focusLossDuration?: number; // seconds
  eyeClosed?: boolean;
  drowsiness?: number; // 0-100
}

export interface InterviewSession {
  id: string;
  candidateName: string;
  startTime: Date;
  endTime?: Date;
  events: ProctoringEvent[];
  integrityScore: number;
  status: "active" | "completed" | "paused";
}

export interface ProctoringConfig {
  focusLossThreshold: number; // seconds
  noFaceThreshold: number; // seconds
  detectionInterval: number; // milliseconds
  recordVideo: boolean;
  enableObjectDetection: boolean;
}
