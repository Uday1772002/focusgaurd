const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export interface Session {
  id: string;
  candidateName: string;
  startTime: Date;
  endTime?: Date;
  status: "active" | "completed" | "paused";
  integrityScore: number;
  events: ProctoringEvent[];
}

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
  duration?: number;
}

export interface ProctoringReport {
  sessionId: string;
  candidateName: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  integrityScore: number;
  totalEvents: number;
  eventsByType: {
    focusLost: number;
    noFace: number;
    multipleFaces: number;
    phoneDetected: number;
    notesDetected: number;
    deviceDetected: number;
  };
  events: ProctoringEvent[];
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Session management
  async createSession(candidateName: string): Promise<Session> {
    return this.request<Session>("/sessions", {
      method: "POST",
      body: JSON.stringify({ candidateName }),
    });
  }

  async getSession(sessionId: string): Promise<Session> {
    return this.request<Session>(`/sessions/${sessionId}`);
  }

  async endSession(sessionId: string): Promise<Session> {
    return this.request<Session>(`/sessions/${sessionId}/end`, {
      method: "PUT",
    });
  }

  async getAllSessions(): Promise<Session[]> {
    return this.request<Session[]>("/sessions");
  }

  // Event management
  async addEvent(
    sessionId: string,
    event: Omit<ProctoringEvent, "id" | "timestamp">
  ): Promise<ProctoringEvent> {
    return this.request<ProctoringEvent>(`/sessions/${sessionId}/events`, {
      method: "POST",
      body: JSON.stringify(event),
    });
  }

  // Video upload
  async uploadVideo(
    file: File,
    sessionId?: string
  ): Promise<{
    message: string;
    filename: string;
    path: string;
    videoId?: string;
  }> {
    const formData = new FormData();
    formData.append("video", file);
    if (sessionId) {
      formData.append("sessionId", sessionId);
    }

    const response = await fetch(`${API_BASE_URL}/upload/video`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Video upload failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Report generation
  async getReport(sessionId: string): Promise<ProctoringReport> {
    return this.request<ProctoringReport>(`/sessions/${sessionId}/report`);
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>("/health");
  }
}

export const apiService = new ApiService();
