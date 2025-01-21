'use client';

import { useState } from 'react';
import { ServiceType } from '@/types/workshop';

interface Props {
  types: ServiceType[];
  onUpdate: (types: ServiceType[]) => void;
}

export default function ServiceTypeConfiguration({ types, onUpdate }: Props) {
  const [newType, setNewType] = useState<Partial<ServiceType>>({
    name: '',
    standardDuration: 60,
    requiredSpecialties: []
  });

  const [newSpecialty, setNewSpecialty] = useState('');

  const addServiceType = () => {
    if (!newType.name) return;
    
    onUpdate([...types, {
      id: Date.now().toString(),
      name: newType.name,
      standardDuration: newType.standardDuration || 60,
      requiredSpecialties: newType.requiredSpecialties || []
    }]);
    
    setNewType({ name: '', standardDuration: 60, requiredSpecialties: [] });
  };

  const addSpecialty = () => {
    if (!newSpecialty || newType.requiredSpecialties?.includes(newSpecialty)) return;
    
    setNewType({
      ...newType,
      requiredSpecialties: [...(newType.requiredSpecialties || []), newSpecialty]
    });
    setNewSpecialty('');
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {types.map(type => (
          <div key={type.id} className="p-3 border rounded">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-medium">{type.name}</h3>
                <p className="text-sm text-gray-600">
                  Duración: {type.standardDuration} minutos
                </p>
              </div>
              <button
                onClick={() => onUpdate(types.filter(t => t.id !== type.id))}
                className="text-red-600 hover:text-red-800"
              >
                Eliminar
              </button>
            </div>
            <div className="text-sm">
              <p className="font-medium">Especialidades requeridas:</p>
              <ul className="list-disc list-inside">
                {type.requiredSpecialties.map((specialty, index) => (
                  <li key={index}>{specialty}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t pt-4">
        <h3 className="font-medium mb-2">Agregar Nuevo Tipo de Servicio</h3>
        <div className="grid gap-2">
          <input
            type="text"
            placeholder="Nombre del servicio"
            value={newType.name}
            onChange={(e) => setNewType({ ...newType, name: e.target.value })}
            className="border rounded px-3 py-2"
          />
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Duración (minutos)"
              value={newType.standardDuration}
              onChange={(e) => setNewType({ 
                ...newType, 
                standardDuration: parseInt(e.target.value) || 60 
              })}
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nueva especialidad"
              value={newSpecialty}
              onChange={(e) => setNewSpecialty(e.target.value)}
              className="border rounded px-3 py-2 flex-1"
            />
            <button
              onClick={addSpecialty}
              className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
            >
              Agregar
            </button>
          </div>

          {(newType.requiredSpecialties ?? []).length > 0 && (
            <div className="text-sm">
              <p className="font-medium">Especialidades:</p>
              <ul className="list-disc list-inside">
                {(newType.requiredSpecialties ?? []).map((specialty, index) => (
                  <li key={index}>{specialty}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={addServiceType}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Agregar Tipo de Servicio
          </button>
        </div>
      </div>
    </div>
  );
} 