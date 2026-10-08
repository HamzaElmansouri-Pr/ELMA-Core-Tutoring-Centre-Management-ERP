import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTimetable } from "@/api/timetable";
import { Button } from "@/components/ui/button";
import { AttendanceDialog } from "@/components/timetable/AttendanceDialog";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const START_HOUR = 8;
const END_HOUR = 20;

function getMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); 
  return new Date(date.setDate(diff));
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function TimetablePage() {
  const { t, i18n } = useTranslation("common");
  const [currentWeekMonday, setCurrentWeekMonday] = useState<Date>(getMonday(new Date()));
  const [selectedClass, setSelectedClass] = useState<{ id: number; name: string; date: string } | null>(null);

  const { data: blocks = [] } = useQuery({
    queryKey: ["timetable"],
    queryFn: getTimetable,
  });

  // Calculate the 7 dates for the current week view
  const weekDates = useMemo(() => {
    return DAYS_OF_WEEK.map((day, index) => {
      const date = addDays(currentWeekMonday, index);
      return {
        dayString: day, // 'monday'
        dateObj: date,
        formattedDate: date.toISOString().split('T')[0], // YYYY-MM-DD
        display: date.toLocaleDateString(i18n.language, { weekday: 'short', month: 'short', day: 'numeric' })
      };
    });
  }, [currentWeekMonday, i18n.language]);

  const handlePrevWeek = () => setCurrentWeekMonday(addDays(currentWeekMonday, -7));
  const handleNextWeek = () => setCurrentWeekMonday(addDays(currentWeekMonday, 7));
  const handleToday = () => setCurrentWeekMonday(getMonday(new Date()));

  // Utility to calculate position
  const getStyleForBlock = (start: string, end: string) => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    
    const startOffset = startH + startM / 60 - START_HOUR;
    const duration = endH + endM / 60 - (startH + startM / 60);
    const totalHours = END_HOUR - START_HOUR;

    return {
      top: `${(startOffset / totalHours) * 100}%`,
      height: `${(duration / totalHours) * 100}%`,
    };
  };

  return (
    <div className="p-4 sm:p-8 max-w-[1600px] mx-auto h-[calc(100vh-80px)] flex flex-col space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <CalendarIcon className="w-6 h-6 text-primary" />
            {t('timetable', 'Timetable Planning')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage class schedules and track daily attendance.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-muted/50 p-1.5 rounded-xl border border-border">
          <Button variant="ghost" size="icon" className="rounded-lg hover:bg-background hover:shadow-sm" onClick={handlePrevWeek}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" className="rounded-lg font-medium hover:bg-background hover:shadow-sm px-4" onClick={handleToday}>
            {t('today', 'Today')}
          </Button>
          <Button variant="ghost" size="icon" className="rounded-lg hover:bg-background hover:shadow-sm" onClick={handleNextWeek}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl shadow-sm flex flex-col overflow-hidden min-h-0">
        {/* Header Row */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/30 shrink-0">
          {weekDates.map(wd => {
            const isToday = wd.formattedDate === new Date().toISOString().split('T')[0];
            return (
              <div key={wd.formattedDate} className={`p-4 text-center border-e border-border last:border-e-0 relative ${isToday ? 'bg-primary/5' : ''}`}>
                {isToday && <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />}
                <div className={`text-sm font-bold uppercase tracking-wider mb-1 ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                  {t(wd.dayString, wd.dayString)}
                </div>
                <div className={`text-lg font-medium ${isToday ? 'text-foreground' : 'text-muted-foreground/80'}`}>
                  {wd.display}
                </div>
              </div>
            );
          })}
        </div>

        {/* Grid Body */}
        <div className="flex-1 relative grid grid-cols-7 overflow-y-auto">
          {/* Hour Lines (Background) */}
          <div className="absolute inset-0 pointer-events-none flex flex-col min-w-full">
            {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
              <div key={i} className="flex-1 border-b border-border/50 relative">
                <span className="absolute -top-2.5 left-2 text-[10px] font-semibold text-muted-foreground/70 bg-card px-1 rounded-sm">
                  {START_HOUR + i}:00
                </span>
              </div>
            ))}
          </div>

          {/* Columns */}
          {weekDates.map(wd => {
            const dayBlocks = blocks.filter(b => b.day === wd.dayString);
            const isToday = wd.formattedDate === new Date().toISOString().split('T')[0];
            
            return (
              <div key={wd.formattedDate} className={`relative border-e border-border/50 last:border-e-0 min-h-[800px] ${isToday ? 'bg-primary/[0.02]' : ''}`}>
                {dayBlocks.map((block, idx) => (
                  <div 
                    key={`${block.class_id}-${idx}`}
                    className="absolute inset-x-1.5 p-3 rounded-xl bg-blue-100/80 border border-blue-200 text-blue-900 shadow-sm cursor-pointer hover:bg-blue-100 hover:shadow-md hover:ring-2 hover:ring-blue-400 hover:z-10 transition-all dark:bg-blue-500/20 dark:border-blue-500/30 dark:text-blue-100 dark:hover:bg-blue-500/30 flex flex-col"
                    style={getStyleForBlock(block.start, block.end)}
                    onClick={() => setSelectedClass({ id: block.class_id, name: block.class_name, date: wd.formattedDate })}
                  >
                    <div className="font-bold text-xs truncate w-full mb-0.5">{block.class_name}</div>
                    <div className="text-[11px] opacity-90 truncate w-full font-medium">{block.subject_name}</div>
                    <div className="mt-auto text-[10px] font-medium opacity-80 truncate w-full flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50"></div>
                      {block.start} - {block.end}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {selectedClass && (
        <AttendanceDialog 
          open={!!selectedClass}
          onOpenChange={(open) => !open && setSelectedClass(null)}
          classId={selectedClass.id}
          className={selectedClass.name}
          sessionDate={selectedClass.date}
        />
      )}
    </div>
  );
}
