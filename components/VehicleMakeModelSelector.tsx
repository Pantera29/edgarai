"use client"

import React, { useState, useEffect } from "react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ChevronDown, Car } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VehicleMake {
  id: string;
  name: string;
}

interface VehicleModel {
  id: string;
  name: string;
  make_id: string;
}

interface VehicleMakeModelSelectorProps {
  dealershipId: string;
  onMakeChange: (make: string) => void;
  onModelChange: (model: string) => void;
  selectedMake: string;
  selectedModel: string;
  disabled?: boolean;
}

export function VehicleMakeModelSelector({
  dealershipId,
  onMakeChange,
  onModelChange,
  selectedMake,
  selectedModel,
  disabled = false
}: VehicleMakeModelSelectorProps) {
  const [makes, setMakes] = useState<VehicleMake[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [makeOpen, setMakeOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [makeSearch, setMakeSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

  const makeRef = React.useRef<HTMLDivElement>(null);
  const modelRef = React.useRef<HTMLDivElement>(null);

  // Cargar marcas disponibles
  useEffect(() => {
    const loadMakes = async () => {
      if (!dealershipId) return;

      try {
        setIsLoading(true);
        
        // Obtener marcas permitidas para el dealership
        const { data: dealershipBrands, error: dealershipError } = await supabase
          .from('dealership_brands')
          .select(`
            make_id,
            vehicle_makes!inner (
              id,
              name
            )
          `)
          .eq('dealership_id', dealershipId);

        if (dealershipError) {
          console.error('Error cargando marcas del dealership:', dealershipError);
          // Fallback: cargar todas las marcas
          const { data: allMakes, error: allMakesError } = await supabase
            .from('vehicle_makes')
            .select('id, name')
            .order('name');

          if (allMakesError) {
            console.error('Error cargando todas las marcas:', allMakesError);
            return;
          }

          setMakes(allMakes || []);
        } else {
          // Extraer marcas del dealership_brands
          const makesArray = dealershipBrands.map((brand: any) => brand.vehicle_makes);
          setMakes(makesArray);
        }
      } catch (error) {
        console.error('Error al cargar marcas:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMakes();
  }, [dealershipId, supabase]);

  // Cargar modelos cuando se selecciona una marca
  useEffect(() => {
    const loadModels = async () => {
      if (!selectedMake) {
        setModels([]);
        return;
      }

      try {
        const { data: modelsData, error } = await supabase
          .from('vehicle_models')
          .select('id, name, make_id')
          .eq('make_id', selectedMake)
          .eq('is_active', true)
          .order('name');

        if (error) {
          console.error('Error cargando modelos:', error);
          return;
        }

        setModels(modelsData || []);
      } catch (error) {
        console.error('Error al cargar modelos:', error);
      }
    };

    loadModels();
  }, [selectedMake, supabase]);

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (makeRef.current && !makeRef.current.contains(event.target as Node)) {
        setMakeOpen(false);
      }
      if (modelRef.current && !modelRef.current.contains(event.target as Node)) {
        setModelOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedMakeData = makes.find(m => m.id === selectedMake);
  const selectedModelData = models.find(m => m.id === selectedModel);

  const filteredMakes = makeSearch.trim() === ''
    ? makes
    : makes.filter(make =>
        make.name.toLowerCase().includes(makeSearch.toLowerCase())
      );

  const filteredModels = modelSearch.trim() === ''
    ? models
    : models.filter(model =>
        model.name.toLowerCase().includes(modelSearch.toLowerCase())
      );

  const handleMakeSelect = (makeId: string) => {
    onMakeChange(makeId);
    onModelChange(''); // Reset modelo cuando cambia la marca
    setMakeOpen(false);
    setMakeSearch('');
  };

  const handleModelSelect = (modelId: string) => {
    onModelChange(modelId);
    setModelOpen(false);
    setModelSearch('');
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Marca</label>
          <div className="h-10 bg-gray-100 animate-pulse rounded-md"></div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Modelo</label>
          <div className="h-10 bg-gray-100 animate-pulse rounded-md"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Selector de Marca */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Marca</label>
        <div className="relative w-full" ref={makeRef}>
          <button
            type="button"
            className={cn(
              "w-full border rounded-md px-3 py-2 text-left bg-white flex items-center justify-between",
              disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'
            )}
            onClick={() => !disabled && setMakeOpen((prev) => !prev)}
            disabled={disabled}
          >
            <span className={cn(
              selectedMakeData ? "font-medium" : "text-gray-500"
            )}>
              {selectedMakeData ? selectedMakeData.name : "Seleccionar marca"}
            </span>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>
          
          {makeOpen && !disabled && (
            <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg">
              <input
                type="text"
                className="w-full px-3 py-2 border-b outline-none bg-white text-black"
                placeholder="Buscar marca..."
                value={makeSearch}
                onChange={e => setMakeSearch(e.target.value)}
                autoFocus
              />
              <ul className="max-h-60 overflow-y-auto">
                {filteredMakes.length > 0 ? (
                  filteredMakes.map((make) => (
                    <li
                      key={make.id}
                      className={cn(
                        "px-3 py-2 cursor-pointer hover:bg-blue-100",
                        selectedMake === make.id ? 'bg-blue-50 font-semibold' : ''
                      )}
                      onClick={() => handleMakeSelect(make.id)}
                    >
                      <span className="font-medium">{make.name}</span>
                    </li>
                  ))
                ) : makeSearch.trim() ? (
                  <li className="px-3 py-2 text-gray-400 text-center">
                    No se encontraron marcas
                  </li>
                ) : (
                  <li className="px-3 py-2 text-gray-400 text-center">
                    Escribe para buscar marcas
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Selector de Modelo */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Modelo</label>
        <div className="relative w-full" ref={modelRef}>
          <button
            type="button"
            className={cn(
              "w-full border rounded-md px-3 py-2 text-left bg-white flex items-center justify-between",
              disabled || !selectedMake ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'
            )}
            onClick={() => !disabled && selectedMake && setModelOpen((prev) => !prev)}
            disabled={disabled || !selectedMake}
          >
            <span className={cn(
              selectedModelData ? "font-medium" : "text-gray-500"
            )}>
              {selectedModelData ? selectedModelData.name : "Seleccionar modelo"}
            </span>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>
          
          {modelOpen && !disabled && selectedMake && (
            <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg">
              <input
                type="text"
                className="w-full px-3 py-2 border-b outline-none bg-white text-black"
                placeholder="Buscar modelo..."
                value={modelSearch}
                onChange={e => setModelSearch(e.target.value)}
                autoFocus
              />
              <ul className="max-h-60 overflow-y-auto">
                {filteredModels.length > 0 ? (
                  filteredModels.map((model) => (
                    <li
                      key={model.id}
                      className={cn(
                        "px-3 py-2 cursor-pointer hover:bg-blue-100",
                        selectedModel === model.id ? 'bg-blue-50 font-semibold' : ''
                      )}
                      onClick={() => handleModelSelect(model.id)}
                    >
                      <span className="font-medium">{model.name}</span>
                    </li>
                  ))
                ) : modelSearch.trim() ? (
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
      </div>
    </div>
  );
} 