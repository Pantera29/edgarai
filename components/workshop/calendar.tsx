'use client';

import { useState } from 'react';
import { BlockedTime } from '@/types/workshop';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface Props {
  blockedTimes: BlockedTime[];
  onDateSelect: (date: Date) => void;
}

export default function Calendar({ blockedTimes, onDateSelect }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isDateBlocked = (date: Date) => {
    return blockedTimes.some(block => {
      const blockStart = new Date(block.startDate);
      const blockEnd = new Date(block.endDate);
      
      if (block.type === 'FULL_DAY') {
        return date.toDateString() === blockStart.toDateString();
      }
      
      return (
        date.toDateString() === blockStart.toDateString() &&
        block.type === 'PARTIAL_DAY'
      );
    });
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateSelect(date);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayOfMonth = getFirstDayOfMonth(currentDate);
    const days = [];

    // Días vacíos al inicio
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-12" />);
    }

    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const isBlocked = isDateBlocked(date);
      const isSelected = selectedDate?.toDateString() === date.toDateString();
      const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

      days.push(
        <button
          key={day}
          onClick={() => !isPast && handleDateClick(date)}
          disabled={isPast}
          className={`
            h-12 rounded-lg relative
            ${isPast ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}
            ${isSelected ? 'bg-blue-100 hover:bg-blue-200' : ''}
            ${isBlocked ? 'bg-red-50' : ''}
          `}
        >
          <span className="relative z-10">{day}</span>
          {isBlocked && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-red-500" />
            </div>
          )}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="p-0">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        
        <h2 className="text-lg font-semibold">
          {currentDate.toLocaleDateString('es-ES', {
            month: 'long',
            year: 'numeric'
          })}
        </h2>
        
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-600">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {renderCalendar()}
      </div>

      <div className="mt-4 flex items-center gap-4 text-sm text-gray-600 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span>Tiempo Bloqueado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span>Seleccionado</span>
        </div>
      </div>
    </div>
  );
} 