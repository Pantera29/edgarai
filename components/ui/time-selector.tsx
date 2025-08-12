'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function TimeSelector({
  value,
  onChange,
  disabled = false,
  placeholder = "Seleccionar hora",
  className
}: TimeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Generar opciones de horas (00-23)
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  
  // Generar opciones de minutos (00-59)
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  // Parsear el valor actual
  const [currentHour, currentMinute] = value ? value.split(':') : ['', ''];

  const handleHourChange = (hour: string) => {
    const newTime = `${hour}:${currentMinute || '00'}`;
    onChange(newTime);
  };

  const handleMinuteChange = (minute: string) => {
    const newTime = `${currentHour || '00'}:${minute}`;
    onChange(newTime);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <Clock className="mr-2 h-4 w-4" />
          {value || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4">
          <div className="flex items-center space-x-4">
            {/* Selector de horas */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-center">Hora</div>
              <ScrollArea className="h-48 w-20">
                <div className="space-y-1">
                  {hours.map((hour) => (
                    <Button
                      key={hour}
                      variant={currentHour === hour ? "default" : "ghost"}
                      size="sm"
                      onClick={() => handleHourChange(hour)}
                      className="w-full justify-center"
                    >
                      {hour}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="text-2xl font-bold">:</div>

            {/* Selector de minutos */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-center">Minuto</div>
              <ScrollArea className="h-48 w-20">
                <div className="space-y-1">
                  {minutes.map((minute) => (
                    <Button
                      key={minute}
                      variant={currentMinute === minute ? "default" : "ghost"}
                      size="sm"
                      onClick={() => handleMinuteChange(minute)}
                      className="w-full justify-center"
                    >
                      {minute}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
