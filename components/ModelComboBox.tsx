"use client"

import React from "react"

interface VehicleModel {
  id: string;
  name: string;
  make_id: string;
}

interface ModelComboBoxProps {
  modelos: VehicleModel[];
  onSelect: (id: string) => void;
  value: string;
  disabled?: boolean;
  placeholder?: string;
}

export function ModelComboBox({ 
  modelos, 
  onSelect, 
  value, 
  disabled = false,
  placeholder = "Seleccionar modelo"
}: ModelComboBoxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const triggerRef = React.useRef<HTMLDivElement>(null);

  // Buscar el modelo seleccionado
  const selectedModel = modelos?.find(m => m.id === value);

  // Filtrar modelos por búsqueda de nombre
  const filtered = search.trim() === ''
    ? modelos || []
    : (modelos || []).filter(modelo =>
        modelo.name.toLowerCase().includes(search.toLowerCase())
      );

  // Cerrar el dropdown si se hace clic fuera
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative w-full" ref={triggerRef}>
      <button
        type="button"
        className={`w-full border rounded-md px-3 py-2 text-left bg-white ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        disabled={disabled}
      >
        {selectedModel ? (
          <span className="font-medium">
            {selectedModel.name}
          </span>
        ) : (
          placeholder
        )}
      </button>
      {open && !disabled && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg">
          <input
            type="text"
            className="w-full px-3 py-2 border-b outline-none bg-white text-black"
            placeholder="Buscar modelo por nombre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
          <ul className="max-h-60 overflow-y-auto">
            {filtered.length > 0 ? (
              filtered.map((modelo) => (
                <li
                  key={modelo.id}
                  className={`px-3 py-2 cursor-pointer hover:bg-blue-100 ${value === modelo.id ? 'bg-blue-50 font-semibold' : ''}`}
                  onClick={() => {
                    onSelect(modelo.id);
                    setOpen(false);
                    setSearch('');
                  }}
                >
                  <span className="font-medium">
                    {modelo.name}
                  </span>
                </li>
              ))
            ) : search.trim() ? (
              <li className="px-3 py-2 text-gray-400 text-center">
                No se encontraron modelos
              </li>
            ) : (
              <li className="px-3 py-2 text-gray-400 text-center">
                Escribe para buscar modelos
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
} 