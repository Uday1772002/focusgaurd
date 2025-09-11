import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProctoringEvent } from '@/types/proctoring';
import { format } from 'date-fns';
import { AlertTriangle, Eye, Users, Phone, BookOpen, Monitor, Download } from 'lucide-react';

interface EventLogProps {
  events: ProctoringEvent[];
  onClearLog: () => void;
  onExportLog: () => void;
}

const getEventIcon = (type: ProctoringEvent['type']) => {
  switch (type) {
    case 'focus_lost': return <Eye className="w-4 h-4" />;
    case 'no_face': return <Eye className="w-4 h-4" />;
    case 'multiple_faces': return <Users className="w-4 h-4" />;
    case 'phone_detected': return <Phone className="w-4 h-4" />;
    case 'notes_detected': return <BookOpen className="w-4 h-4" />;
    case 'device_detected': return <Monitor className="w-4 h-4" />;
  }
};

const getSeverityColor = (severity: ProctoringEvent['severity']) => {
  switch (severity) {
    case 'low': return 'bg-status-safe/20 text-status-safe border-status-safe/20';
    case 'medium': return 'bg-status-warning/20 text-status-warning border-status-warning/20';
    case 'high': return 'bg-status-danger/20 text-status-danger border-status-danger/20';
  }
};

export const EventLog = ({ events, onClearLog, onExportLog }: EventLogProps) => {
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const filteredEvents = events.filter(event => 
    filter === 'all' || event.severity === filter
  );

  const getSeverityStats = () => {
    const stats = { high: 0, medium: 0, low: 0 };
    events.forEach(event => stats[event.severity]++);
    return stats;
  };

  const stats = getSeverityStats();

  return (
    <Card className="bg-monitor-panel border-monitor-border shadow-monitor h-full">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Event Log</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onExportLog}>
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={onClearLog}>
              Clear
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">{events.length}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-status-danger">{stats.high}</div>
            <div className="text-xs text-muted-foreground">High</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-status-warning">{stats.medium}</div>
            <div className="text-xs text-muted-foreground">Medium</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-status-safe">{stats.low}</div>
            <div className="text-xs text-muted-foreground">Low</div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-1 mb-4">
          {(['all', 'high', 'medium', 'low'] as const).map(level => (
            <Button
              key={level}
              variant={filter === level ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(level)}
              className="text-xs"
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </Button>
          ))}
        </div>

        {/* Event List */}
        <ScrollArea className="h-64">
          <div className="space-y-2">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No events logged yet
              </div>
            ) : (
              filteredEvents.map((event, index) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 bg-monitor-bg rounded-lg border border-monitor-border"
                >
                  <div className={`p-1 rounded-full ${getSeverityColor(event.severity)}`}>
                    {getEventIcon(event.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground truncate">
                        {event.description}
                      </p>
                      <Badge variant="outline" className={getSeverityColor(event.severity)}>
                        {event.severity}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground">
                        {format(event.timestamp, 'HH:mm:ss')}
                      </p>
                      {event.duration && (
                        <p className="text-xs text-muted-foreground">
                          Duration: {event.duration}s
                        </p>
                      )}
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