
import { useState, useEffect } from "react";
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { AvailabilityService } from "@/services/availabilityService";
import { PropertyAvailability } from "@/types/availability";
import { cn } from "@/lib/utils";

interface MiniAvailabilityCalendarProps {
  propertyId: string;
  className?: string;
  onDateSelect?: (date: string) => void;
}

const MiniAvailabilityCalendar = ({ propertyId, className, onDateSelect }: MiniAvailabilityCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availability, setAvailability] = useState<PropertyAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = addDays(monthStart, -monthStart.getDay());
  const calendarEnd = addDays(monthEnd, 6 - monthEnd.getDay());

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setIsLoading(true);
        const data = await AvailabilityService.fetchPropertyAvailability(
          propertyId,
          calendarStart.toISOString().split('T')[0],
          calendarEnd.toISOString().split('T')[0]
        );
        setAvailability(data);
      } catch (error) {
        console.error('Error fetching mini calendar availability:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailability();
  }, [propertyId, currentDate]);

  const availabilityMap = new Map(availability.map(a => [a.date, a.status]));
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getDateStatus = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    const minDate = addDays(new Date(), 14); // 14 days advance
    
    if (date < minDate) return 'past';
    return availabilityMap.get(dateString) || 'unavailable';
  };

  const getDateStyles = (date: Date) => {
    const status = getDateStatus(date);
    const isCurrentMonth = isSameMonth(date, currentDate);
    
    return cn(
      "h-6 w-6 text-xs flex items-center justify-center rounded transition-colors",
      {
        "text-gray-300": !isCurrentMonth,
        "text-gray-700": isCurrentMonth,
        "bg-green-100 text-green-800": status === 'available' && isCurrentMonth,
        "bg-red-100 text-red-800": status === 'blocked' && isCurrentMonth,
        "bg-blue-100 text-blue-800": status === 'reserved' && isCurrentMonth,
        "bg-gray-50": status === 'unavailable' && isCurrentMonth,
        "ring-1 ring-runner-orange-500": isToday(date),
        "cursor-pointer hover:scale-110": status === 'available' && onDateSelect
      }
    );
  };

  const weekDays = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

  return (
    <div className={cn("bg-white border rounded-lg p-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium flex items-center">
          <CalendarIcon className="h-4 w-4 mr-1" />
          Disponibilidad
        </h4>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, -1))}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronLeft className="h-3 w-3" />
          </button>
          <span className="text-xs font-medium min-w-[60px] text-center">
            {format(currentDate, 'MMM yy', { locale: es })}
          </span>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="space-y-1">
        {/* Week headers */}
        <div className="grid grid-cols-7 gap-0.5">
          {weekDays.map(day => (
            <div key={day} className="h-5 flex items-center justify-center text-xs text-gray-500 font-medium">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {calendarDays.map(date => {
            const dateString = date.toISOString().split('T')[0];
            return (
              <div
                key={dateString}
                className={getDateStyles(date)}
                onClick={() => {
                  if (getDateStatus(date) === 'available' && onDateSelect) {
                    onDateSelect(dateString);
                  }
                }}
              >
                {format(date, 'd')}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick stats */}
      <div className="mt-3 flex justify-between text-xs text-gray-600">
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-100 rounded-full"></div>
          {availability.filter(a => a.status === 'available').length} disponible
        </span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 bg-blue-100 rounded-full"></div>
          {availability.filter(a => a.status === 'reserved').length} reservado
        </span>
      </div>
    </div>
  );
};

export default MiniAvailabilityCalendar;
