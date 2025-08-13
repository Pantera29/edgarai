"use client"

import React, { useState, useEffect, useRef } from "react"
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Service {
  id_uuid: string;
  service_name: string;
  description: string;
}

interface ServiceDropdownProps {
  label: string;
  options: Service[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}

export function ServiceDropdown({
  label,
  options,
  selectedValue,
  onValueChange,
  placeholder,
  disabled = false
}: ServiceDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedOption = options.find(option => option.id_uuid === selectedValue);

  const filteredOptions = search.trim() === ''
    ? options
    : options.filter(option =>
        option.service_name.toLowerCase().includes(search.toLowerCase())
      );

  const handleSelect = (value: string) => {
    onValueChange(value);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="relative w-full" ref={dropdownRef}>
        <button
          type="button"
          className={cn(
            "w-full border rounded-md px-3 py-2 text-left bg-white flex items-center justify-between",
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'
          )}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          disabled={disabled}
        >
          <span className={cn(
            selectedOption ? "font-medium" : "text-gray-500"
          )}>
            {selectedOption ? selectedOption.service_name : placeholder}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>
        
        {isOpen && !disabled && (
          <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg">
            <input
              type="text"
              className="w-full px-3 py-2 border-b outline-none bg-white text-black"
              placeholder={`Buscar ${label.toLowerCase()}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
            <ul className="max-h-60 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <li
                    key={option.id_uuid}
                    className={cn(
                      "px-3 py-2 cursor-pointer hover:bg-blue-100",
                      selectedValue === option.id_uuid ? 'bg-blue-50 font-semibold' : ''
                    )}
                    onClick={() => handleSelect(option.id_uuid)}
                  >
                    <span className="font-medium">{option.service_name}</span>
                  </li>
                ))
              ) : search.trim() ? (
                <li className="px-3 py-2 text-gray-400 text-center">
                  No se encontraron {label.toLowerCase()}s
                </li>
              ) : (
                <li className="px-3 py-2 text-gray-400 text-center">
                  Escribe para buscar {label.toLowerCase()}s
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
