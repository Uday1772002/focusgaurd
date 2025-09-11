import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertConfig } from "@/hooks/useAlerts";
import { format } from "date-fns";
import { AlertTriangle, CheckCircle, X, Bell, BellOff } from "lucide-react";

interface AlertsPanelProps {
  alerts: Alert[];
  onAcknowledge: (alertId: string) => void;
  onClear: () => void;
  unacknowledgedCount: number;
}

const getSeverityColor = (severity: Alert["severity"]) => {
  switch (severity) {
    case "low":
      return "bg-status-safe/20 text-status-safe border-status-safe/20";
    case "medium":
      return "bg-status-warning/20 text-status-warning border-status-warning/20";
    case "high":
      return "bg-status-danger/20 text-status-danger border-status-danger/20";
  }
};

const getSeverityIcon = (severity: Alert["severity"]) => {
  switch (severity) {
    case "low":
      return <CheckCircle className="w-4 h-4" />;
    case "medium":
      return <AlertTriangle className="w-4 h-4" />;
    case "high":
      return <AlertTriangle className="w-4 h-4" />;
  }
};

export const AlertsPanel = ({
  alerts,
  onAcknowledge,
  onClear,
  unacknowledgedCount,
}: AlertsPanelProps) => {
  const getAlertsBySeverity = (severity: "low" | "medium" | "high") => {
    return alerts.filter((alert) => alert.severity === severity);
  };

  const stats = {
    high: getAlertsBySeverity("high").length,
    medium: getAlertsBySeverity("medium").length,
    low: getAlertsBySeverity("low").length,
  };

  return (
    <Card className="bg-monitor-panel border-monitor-border shadow-monitor h-full">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Real-time Alerts
            {unacknowledgedCount > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {unacknowledgedCount}
              </Badge>
            )}
          </h3>
          <Button variant="outline" size="sm" onClick={onClear}>
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">
              {alerts.length}
            </div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-status-danger">
              {stats.high}
            </div>
            <div className="text-xs text-muted-foreground">High</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-status-warning">
              {stats.medium}
            </div>
            <div className="text-xs text-muted-foreground">Medium</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-status-safe">
              {stats.low}
            </div>
            <div className="text-xs text-muted-foreground">Low</div>
          </div>
        </div>

        {/* Alerts List */}
        <ScrollArea className="h-64">
          <div className="space-y-2">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BellOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No alerts yet</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    alert.acknowledged
                      ? "bg-monitor-bg border-monitor-border opacity-60"
                      : "bg-monitor-bg border-monitor-border"
                  }`}
                >
                  <div
                    className={`p-1 rounded-full ${getSeverityColor(
                      alert.severity
                    )}`}
                  >
                    {getSeverityIcon(alert.severity)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground truncate">
                        {alert.message}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={getSeverityColor(alert.severity)}
                        >
                          {alert.severity}
                        </Badge>
                        {!alert.acknowledged && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onAcknowledge(alert.id)}
                            className="h-6 w-6 p-0"
                          >
                            <CheckCircle className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground">
                        {format(alert.timestamp, "HH:mm:ss")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {alert.type.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
};
