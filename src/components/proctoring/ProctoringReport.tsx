import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { InterviewSession } from "@/types/proctoring";
import { format, differenceInMinutes, differenceInSeconds } from "date-fns";
import {
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Users,
  Phone,
  BookOpen,
  Monitor,
} from "lucide-react";

interface ProctoringReportProps {
  session: InterviewSession;
}

export const ProctoringReport = ({ session }: ProctoringReportProps) => {
  const duration = session.endTime
    ? differenceInMinutes(session.endTime, session.startTime)
    : differenceInMinutes(new Date(), session.startTime);

  const getEventStats = () => {
    const stats = {
      focusLoss: session.events.filter((e) => e.type === "focus_lost").length,
      noFace: session.events.filter((e) => e.type === "no_face").length,
      multipleFaces: session.events.filter((e) => e.type === "multiple_faces")
        .length,
      phoneDetected: session.events.filter((e) => e.type === "phone_detected")
        .length,
      notesDetected: session.events.filter((e) => e.type === "notes_detected")
        .length,
      deviceDetected: session.events.filter((e) => e.type === "device_detected")
        .length,
    };

    const totalViolations = Object.values(stats).reduce(
      (sum, count) => sum + count,
      0
    );
    return { ...stats, totalViolations };
  };

  const stats = getEventStats();

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-status-safe";
    if (score >= 70) return "text-status-warning";
    return "text-status-danger";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Good";
    if (score >= 70) return "Fair";
    if (score >= 60) return "Poor";
    return "Critical";
  };

  const exportCSV = () => {
    const header = [
      "Session ID",
      "Candidate Name",
      "Start Time",
      "End Time",
      "Duration (min)",
      "Integrity Score",
      "Event ID",
      "Event Type",
      "Severity",
      "Timestamp",
      "Duration (sec)",
      "Description",
    ];

    const rows = session.events.map((e) => [
      session.id,
      session.candidateName,
      session.startTime.toISOString(),
      session.endTime ? session.endTime.toISOString() : "",
      String(duration),
      String(session.integrityScore),
      e.id,
      e.type,
      e.severity,
      new Date(e.timestamp).toISOString(),
      e.duration ? String(Math.round(e.duration)) : "",
      e.description.replace(/\n/g, " "),
    ]);

    const csv = [header, ...rows]
      .map((r) =>
        r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proctoring-report-${session.candidateName}-${format(
      new Date(),
      "yyyy-MM-dd-HH-mm"
    )}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;
    const styles = `
      <style>
        body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; color: #111; }
        h1 { font-size: 20px; margin: 0 0 8px; }
        .meta { margin: 8px 0 16px; font-size: 12px; color: #333; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
        th { background: #f3f4f6; }
      </style>`;

    const eventsRows = session.events
      .map(
        (e) => `
          <tr>
            <td>${e.id}</td>
            <td>${e.type}</td>
            <td>${e.severity}</td>
            <td>${new Date(e.timestamp).toLocaleString()}</td>
            <td>${e.duration ? Math.round(e.duration) : ""}</td>
            <td>${e.description
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")}</td>
          </tr>`
      )
      .join("");

    w.document.write(`
      <html>
        <head>
          <title>Proctoring Report</title>
          ${styles}
        </head>
        <body>
          <h1>Proctoring Report</h1>
          <div class="meta">
            Candidate: <strong>${session.candidateName}</strong><br/>
            Session ID: ${session.id}<br/>
            Duration: ${duration} minutes<br/>
            Integrity Score: ${session.integrityScore}%
          </div>
          <table>
            <thead>
              <tr>
                <th>Event ID</th>
                <th>Type</th>
                <th>Severity</th>
                <th>Timestamp</th>
                <th>Duration (sec)</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              ${eventsRows || `<tr><td colspan="6">No events</td></tr>`}
            </tbody>
          </table>
        </body>
      </html>`);
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <Card className="bg-monitor-panel border-monitor-border shadow-monitor">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              Proctoring Report
            </h2>
            <p className="text-muted-foreground">
              Interview integrity assessment
            </p>
          </div>
          <div className="text-right space-y-2">
            <div className="text-sm text-muted-foreground">Generated</div>
            <div className="text-sm font-medium">
              {format(new Date(), "dd MMM yyyy, HH:mm")}
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={exportCSV}
                className="px-2 py-1 text-xs rounded border border-monitor-border"
              >
                Export CSV
              </button>
              <button
                onClick={exportPDF}
                className="px-2 py-1 text-xs rounded border border-monitor-border"
              >
                Export PDF
              </button>
            </div>
          </div>
        </div>

        {/* Session Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-monitor-bg border-monitor-border p-4">
            <div className="text-sm text-muted-foreground">Candidate</div>
            <div className="text-lg font-semibold text-foreground">
              {session.candidateName}
            </div>
          </Card>

          <Card className="bg-monitor-bg border-monitor-border p-4">
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Duration
            </div>
            <div className="text-lg font-semibold text-foreground">
              {duration} minutes
            </div>
          </Card>

          <Card className="bg-monitor-bg border-monitor-border p-4">
            <div className="text-sm text-muted-foreground">Session Time</div>
            <div className="text-sm font-semibold text-foreground">
              {format(session.startTime, "HH:mm")} -{" "}
              {session.endTime ? format(session.endTime, "HH:mm") : "Ongoing"}
            </div>
          </Card>
        </div>

        {/* Integrity Score */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-foreground">
              Overall Integrity Score
            </h3>
            <div
              className={`text-3xl font-bold ${getScoreColor(
                session.integrityScore
              )}`}
            >
              {session.integrityScore}%
            </div>
          </div>
          <Progress value={session.integrityScore} className="h-3 mb-2" />
          <div className="flex items-center justify-between">
            <Badge
              variant={session.integrityScore >= 70 ? "default" : "destructive"}
            >
              {getScoreLabel(session.integrityScore)}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {stats.totalViolations} violation
              {stats.totalViolations !== 1 ? "s" : ""} detected
            </span>
          </div>
        </div>

        {/* Violation Breakdown */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Violation Breakdown
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="flex items-center justify-between p-3 bg-monitor-bg rounded-lg border border-monitor-border">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-status-warning" />
                <span className="text-sm">Focus Loss</span>
              </div>
              <Badge variant={stats.focusLoss > 0 ? "destructive" : "outline"}>
                {stats.focusLoss}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-monitor-bg rounded-lg border border-monitor-border">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-status-danger" />
                <span className="text-sm">No Face</span>
              </div>
              <Badge variant={stats.noFace > 0 ? "destructive" : "outline"}>
                {stats.noFace}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-monitor-bg rounded-lg border border-monitor-border">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-status-danger" />
                <span className="text-sm">Multiple Faces</span>
              </div>
              <Badge
                variant={stats.multipleFaces > 0 ? "destructive" : "outline"}
              >
                {stats.multipleFaces}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-monitor-bg rounded-lg border border-monitor-border">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-status-danger" />
                <span className="text-sm">Phone Detected</span>
              </div>
              <Badge
                variant={stats.phoneDetected > 0 ? "destructive" : "outline"}
              >
                {stats.phoneDetected}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-monitor-bg rounded-lg border border-monitor-border">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-status-warning" />
                <span className="text-sm">Notes Detected</span>
              </div>
              <Badge
                variant={stats.notesDetected > 0 ? "destructive" : "outline"}
              >
                {stats.notesDetected}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-monitor-bg rounded-lg border border-monitor-border">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-status-warning" />
                <span className="text-sm">Unauthorized Device</span>
              </div>
              <Badge
                variant={stats.deviceDetected > 0 ? "destructive" : "outline"}
              >
                {stats.deviceDetected}
              </Badge>
            </div>
          </div>
        </div>

        {/* Recent Events */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Recent Events
          </h3>
          {session.events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-12 h-12 text-status-safe mx-auto mb-2" />
              <p>No violations detected during the session</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {session.events.slice(0, 10).map((event, index) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 bg-monitor-bg rounded-lg border border-monitor-border"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle
                      className={`w-4 h-4 ${
                        event.severity === "high"
                          ? "text-status-danger"
                          : event.severity === "medium"
                          ? "text-status-warning"
                          : "text-status-safe"
                      }`}
                    />
                    <span className="text-sm">{event.description}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">
                      {format(event.timestamp, "HH:mm:ss")}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {event.severity}
                    </Badge>
                  </div>
                </div>
              ))}
              {session.events.length > 10 && (
                <div className="text-center text-sm text-muted-foreground">
                  ... and {session.events.length - 10} more events
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
