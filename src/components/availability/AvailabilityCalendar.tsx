
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Info,
  Settings,
  Save
} from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isWeekend, isPast, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { AvailabilityService } from "@/services/availabilityService";
import { PropertyAvailability, CalendarDay, CalendarSettings } from "@/types/availability";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AvailabilityCalendarProps {
  propertyId: string;
  isOwner?: boolean;
  className?: string;
}

const AvailabilityCalendar = ({ propertyId, isOwner = false, className }: AvailabilityCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availability, setAvailability] = useState<PropertyAvailability[]>([]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [settings] = useState<CalendarSettings>({
    minAdvanceDays: 14,
    maxAdvanceDays: 365,
    minNights: 1,
    maxNights: 30
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = addDays(monthStart, -monthStart.getDay());
  const calendarEnd = addDays(monthEnd, 6 - monthEnd.getDay());

  // Fetch availability data
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
        toast.error('Error al cargar disponibilidad');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailability();
  }, [propertyId, currentDate]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    const availabilityMap = new Map(
      availability.map(a => [a.date, a])
    );

    return days.map(date => {
      const dateString = date.toISOString().split('T')[0];
      const availabilityData = availabilityMap.get(dateString);
      const minDate = addDays(new Date(), settings.minAdvanceDays);
      const maxDate = addDays(new Date(), settings.maxAdvanceDays);

      let status: CalendarDay['status'] = 'unavailable';
      
      if (isPast(date)) {
        status = 'past';
      } else if (date < minDate || date > maxDate) {
        status = 'unavailable';
      } else if (availabilityData) {
        status = availabilityData.status;
      } else if (isOwner) {
        status = 'unavailable';
      } else {
        status = 'unavailable';
      }

      return {
        date,
        dateString,
        status,
        isToday: isToday(date),
        isCurrentMonth: isSameMonth(date, currentDate),
        isWeekend: isWeekend(date),
        notes: availabilityData?.notes
      };
    });
  }, [calendarStart, calendarEnd, availability, currentDate, settings, isOwner]);

  const handleDateClick = (day: CalendarDay, event: React.MouseEvent) => {
    if (!isOwner || day.status === 'past' || day.status === 'reserved') return;

    if (event.shiftKey && selectedDates.length > 0) {
      // Range selection
      const lastSelected = selectedDates[selectedDates.length - 1];
      const start = new Date(Math.min(new Date(lastSelected).getTime(), day.date.getTime()));
      const end = new Date(Math.max(new Date(lastSelected).getTime(), day.date.getTime()));
      
      const rangeDates: string[] = [];
      const current = new Date(start);
      while (current <= end) {
        const currentDateString = current.toISOString().split('T')[0];
        const currentDay = calendarDays.find(d => d.dateString === currentDateString);
        if (currentDay && currentDay.status !== 'past' && currentDay.status !== 'reserved') {
          rangeDates.push(currentDateString);
        }
        current.setDate(current.getDate() + 1);
      }
      
      setSelectedDates(prev => {
        const newSelection = [...prev];
        rangeDates.forEach(date => {
          if (!newSelection.includes(date)) {
            newSelection.push(date);
          }
        });
        return newSelection;
      });
    } else if (event.ctrlKey || event.metaKey) {
      // Multi-select
      setSelectedDates(prev => 
        prev.includes(day.dateString)
          ? prev.filter(d => d !== day.dateString)
          : [...prev, day.dateString]
      );
    } else {
      // Single select
      setSelectedDates(prev => 
        prev.includes(day.dateString) ? [] : [day.dateString]
      );
    }
  };

  const handleStatusToggle = async (newStatus: 'available' | 'blocked') => {
    if (selectedDates.length === 0) return;

    try {
      setIsLoading(true);
      await AvailabilityService.updateAvailability(propertyId, {
        dates: selectedDates,
        status: newStatus
      });

      // Refresh data
      const data = await AvailabilityService.fetchPropertyAvailability(
        propertyId,
        calendarStart.toISOString().split('T')[0],
        calendarEnd.toISOString().split('T')[0]
      );
      setAvailability(data);
      setSelectedDates([]);
      
      toast.success(`${selectedDates.length} fechas actualizadas`);
    } catch (error) {
      toast.error('Error al actualizar disponibilidad');
    } finally {
      setIsLoading(false);
    }
  };

  const getDateStyles = (day: CalendarDay) => {
    const isSelected = selectedDates.includes(day.dateString);
    
    return cn(
      "h-10 w-10 rounded-lg text-sm font-medium transition-all cursor-pointer hover:scale-105 flex items-center justify-center",
      {
        // Base styles
        "text-gray-400": !day.isCurrentMonth,
        "text-gray-900": day.isCurrentMonth,
        
        // Status colors
        "bg-green-100 text-green-800 border border-green-300": day.status === 'available' && !isSelected,
        "bg-red-100 text-red-800 border border-red-300": day.status === 'blocked' && !isSelected,
        "bg-blue-100 text-blue-800 border border-blue-300": day.status === 'reserved' && !isSelected,
        "bg-gray-100 text-gray-500": day.status === 'past' || day.status === 'unavailable',
        
        // Selection styles
        "bg-runner-blue-600 text-white border-2 border-runner-blue-700": isSelected,
        
        // Today highlight
        "ring-2 ring-runner-orange-500": day.isToday && !isSelected,
        
        // Weekend styling
        "font-bold": day.isWeekend,
        
        // Disabled
        "cursor-not-allowed opacity-50": !isOwner || day.status === 'past' || day.status === 'reserved'
      }
    );
  };

  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2" />
            Calendario de Disponibilidad
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-semibold min-w-[180px] text-center">
              {format(currentDate, 'MMMM yyyy', { locale: es })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span>Disponible</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
            <span>Bloqueado</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
            <span>Reservado</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-gray-100 rounded"></div>
            <span>No disponible</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Calendar Grid */}
        <div className="space-y-4">
          {/* Week headers */}
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map(day => (
              <div key={day} className="h-10 flex items-center justify-center text-sm font-medium text-gray-600">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(day => (
              <div
                key={day.dateString}
                className={getDateStyles(day)}
                onClick={(e) => handleDateClick(day, e)}
                title={day.notes || `${format(day.date, 'dd/MM/yyyy')} - ${day.status}`}
              >
                {format(day.date, 'd')}
              </div>
            ))}
          </div>

          {/* Controls for owners */}
          {isOwner && selectedDates.length > 0 && (
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">
                {selectedDates.length} fechas seleccionadas
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusToggle('available')}
                  disabled={isLoading}
                  className="bg-green-50 border-green-300 text-green-800 hover:bg-green-100"
                >
                  Marcar Disponible
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusToggle('blocked')}
                  disabled={isLoading}
                  className="bg-red-50 border-red-300 text-red-800 hover:bg-red-100"
                >
                  Bloquear
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedDates([])}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Instructions for owners */}
          {isOwner && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="space-y-2 text-sm text-blue-800">
                  <p><strong>Cómo usar el calendario:</strong></p>
                  <ul className="space-y-1 ml-4">
                    <li>• Click simple: Seleccionar fecha individual</li>
                    <li>• Ctrl/Cmd + Click: Seleccionar múltiples fechas</li>
                    <li>• Shift + Click: Seleccionar rango de fechas</li>
                    <li>• Solo puedes editar fechas futuras (min. {settings.minAdvanceDays} días)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AvailabilityCalendar;
