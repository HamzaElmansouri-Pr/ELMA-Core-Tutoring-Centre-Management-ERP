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
    <div className="p-6 h-[calc(100vh-80px)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">{t('timetable', 'Timetable')}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevWeek}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={handleToday}>
            <CalendarIcon className="w-4 h-4 me-2" />
            {t('today', 'Today')}
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextWeek}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 bg-white border rounded-md shadow-sm dark:bg-slate-900 flex flex-col overflow-hidden">
        {/* Header Row */}
        <div className="grid grid-cols-7 border-b bg-slate-50 dark:bg-slate-800">
          {weekDates.map(wd => (
            <div key={wd.formattedDate} className="p-3 text-center border-e last:border-e-0">
              <div className="text-sm font-semibold capitalize">{t(wd.dayString, wd.dayString)}</div>
              <div className="text-xs text-gray-500">{wd.display}</div>
            </div>
          ))}
        </div>

        {/* Grid Body */}
        <div className="flex-1 relative grid grid-cols-7 overflow-y-auto">
          {/* Hour Lines (Background) */}
          <div className="absolute inset-0 pointer-events-none flex flex-col">
            {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
              <div key={i} className="flex-1 border-b opacity-50 relative">
                <span className="absolute -top-3 left-2 text-xs text-gray-400 bg-white dark:bg-slate-900 px-1">
                  {START_HOUR + i}:00
                </span>
              </div>
            ))}
          </div>

          {/* Columns */}
          {weekDates.map(wd => {
            const dayBlocks = blocks.filter(b => b.day === wd.dayString);
            
            return (
              <div key={wd.formattedDate} className="relative border-e last:border-e-0 h-[800px]">
                {dayBlocks.map((block, idx) => (
                  <div 
                    key={`${block.class_id}-${idx}`}
                    className="absolute inset-x-1 p-2 rounded border bg-blue-100 border-blue-300 text-blue-900 shadow-sm cursor-pointer hover:bg-blue-200 transition-colors dark:bg-blue-900 dark:border-blue-700 dark:text-blue-100 flex flex-col justify-center items-center text-center overflow-hidden"
                    style={getStyleForBlock(block.start, block.end)}
                    onClick={() => setSelectedClass({ id: block.class_id, name: block.class_name, date: wd.formattedDate })}
                  >
                    <div className="font-bold text-xs truncate w-full">{block.class_name}</div>
                    <div className="text-[10px] opacity-80 truncate w-full">{block.subject_name}</div>
                    <div className="text-[10px] opacity-80 truncate w-full">{block.start} - {block.end}</div>
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
