"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, User, Phone, Mail, Loader2 } from "lucide-react"
import { useClientSearch } from "@/hooks/useClientSearch"

interface Cliente {
  id: string;
  names: string;
  phone_number: string;
  email?: string;
}

interface ChangeVehicleOwnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentOwner: Cliente | null;
  dealershipId: string;
  vehicleId: string;
  onSuccess: (newOwner: Cliente) => void;
  onError?: (error: string) => void;
}

export function ChangeVehicleOwnerDialog({
  open,
  onOpenChange,
  currentOwner,
  dealershipId,
  vehicleId,
  onSuccess,
  onError,
}: ChangeVehicleOwnerDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNewOwner, setSelectedNewOwner] = useState<Cliente | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const {
    clients,
    loading: clientLoading,
    error: clientError,
    searchClients,
  } = useClientSearch(dealershipId);

  // Buscar clientes cuando cambia la búsqueda
  useEffect(() => {
    if (searchQuery.length > 2) {
      searchClients(searchQuery);
    } else if (searchQuery.length === 0) {
      searchClients('');
    }
  }, [searchQuery]);

  // Resetear estado al abrir/cerrar modal
  useEffect(() => {
    if (open) {
      setSearchQuery("");
      setSelectedNewOwner(null);
      searchClients('');
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!selectedNewOwner) return;

    setIsUpdating(true);
    
    try {
      const response = await fetch(`/api/vehicles/update/${vehicleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: selectedNewOwner.id
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al cambiar el titular');
      }

      // Éxito: notificar al componente padre
      onSuccess(selectedNewOwner);
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error al cambiar titular:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setSearchQuery("");
    setSelectedNewOwner(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Cambiar titular del vehículo
          </DialogTitle>
          <DialogDescription>
            Selecciona el nuevo titular para este vehículo. Este cambio quedará registrado en el sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Titular actual */}
          {currentOwner && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                Titular actual
              </Label>
              <div className="p-3 bg-muted rounded-lg">
                <div className="font-medium">{currentOwner.names}</div>
                <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Phone className="w-3 h-3" />
                  {currentOwner.phone_number}
                </div>
                {currentOwner.email && (
                  <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Mail className="w-3 h-3" />
                    {currentOwner.email}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Búsqueda de nuevo titular */}
          <div className="space-y-2">
            <Label htmlFor="search-owner">Buscar nuevo titular</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-owner"
                placeholder="Buscar por nombre o teléfono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              {clientLoading && (
                <div className="absolute right-3 top-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            {clientError && (
              <p className="text-sm text-destructive">Error al buscar clientes</p>
            )}
          </div>

          {/* Nuevo titular seleccionado */}
          {selectedNewOwner && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-primary">
                Nuevo titular seleccionado
              </Label>
              <div className="p-3 bg-primary/5 border-2 border-primary rounded-lg">
                <div className="font-medium">{selectedNewOwner.names}</div>
                <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Phone className="w-3 h-3" />
                  {selectedNewOwner.phone_number}
                </div>
                {selectedNewOwner.email && (
                  <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Mail className="w-3 h-3" />
                    {selectedNewOwner.email}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lista de resultados */}
          {clients.length > 0 && !selectedNewOwner && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                Resultados ({clients.length})
              </Label>
              <div className="border rounded-lg max-h-[240px] overflow-y-auto">
                <ul className="divide-y">
                  {clients
                    .filter(c => c.id !== currentOwner?.id) // Excluir titular actual
                    .map((cliente) => (
                      <li key={cliente.id}>
                        <button
                          type="button"
                          className="w-full px-4 py-3 text-left hover:bg-accent transition-colors"
                          onClick={() => setSelectedNewOwner(cliente)}
                        >
                          <div className="font-medium">{cliente.names}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" />
                            {cliente.phone_number}
                          </div>
                          {cliente.email && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <Mail className="w-3 h-3" />
                              {cliente.email}
                            </div>
                          )}
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          )}

          {/* Sin resultados */}
          {clients.length === 0 && searchQuery.length > 2 && !clientLoading && (
            <div className="text-center py-8 text-muted-foreground">
              <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No se encontraron clientes</p>
              <p className="text-sm">Intenta con otro término de búsqueda</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={isUpdating}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!selectedNewOwner || isUpdating}
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Actualizando...
              </>
            ) : (
              'Confirmar cambio'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

