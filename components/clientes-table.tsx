"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, History, Edit, Trash2, Eye } from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { verifyToken } from "../app/jwt/token";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";


interface Cliente {
  id: string
  names: string
  email: string
  phone_number: string
  phone_number_2?: string | null
  external_id?: string | null
  agent_active: boolean
  dealership_id: string
}

interface Props {
  clientes: Cliente[]
  loading?: boolean
  token?: string
  onClienteDeleted?: () => void
}

export function ClientesTable({ clientes, loading = false, token='',onClienteDeleted }: Props) {
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(
    null
  );

  const { toast } = useToast()
  const [clienteAEliminar, setClienteAEliminar] = useState<Cliente | null>(null)
  const [eliminando, setEliminando] = useState(false)

  const eliminarCliente = async () => {
    if (!clienteAEliminar) return;
    
    try {
      const { error } = await supabase
        .from('client')
        .delete()
        .eq('id', clienteAEliminar.id);
        
      if (error) throw error;
      
      toast({
        title: "Cliente eliminado",
        description: "El cliente ha sido eliminado correctamente."
      });
      
      setClienteAEliminar(null);
      if (onClienteDeleted) onClienteDeleted();
    } catch (error) {
      console.error("Error eliminando cliente:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el cliente. Inténtalo de nuevo."
      });
    }
  };

  const toggleAgentStatus = async (cliente: Cliente) => {
    try {
      console.log('🔄 Actualizando estado del agente para cliente:', cliente.id);
      
      const newAgentActive = !cliente.agent_active;
      const promises = [];
      
      // Actualizar phone_number (principal)
      promises.push(
        fetch('/api/agent-control', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone_number: cliente.phone_number,
            dealership_id: cliente.dealership_id,
            agent_active: newAgentActive,
            notes: `Cambiado manualmente desde tabla de clientes - ${newAgentActive ? 'activado' : 'desactivado'}`,
            updated_by: 'user'
          }),
        })
      );
      
      // Actualizar phone_number_2 si existe
      if (cliente.phone_number_2) {
        console.log('🔄 También actualizando phone_number_2:', cliente.phone_number_2);
        promises.push(
          fetch('/api/agent-control', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              phone_number: cliente.phone_number_2,
              dealership_id: cliente.dealership_id,
              agent_active: newAgentActive,
              notes: `Cambiado manualmente desde tabla de clientes - ${newAgentActive ? 'activado' : 'desactivado'} (phone_number_2)`,
              updated_by: 'user'
            }),
          })
        );
      }

      // Ejecutar todas las actualizaciones en paralelo
      const responses = await Promise.all(promises);
      
      // Verificar que todas fueron exitosas
      const failedResponses = responses.filter(r => !r.ok);
      if (failedResponses.length > 0) {
        const errorData = await failedResponses[0].json();
        throw new Error(errorData.message || `HTTP ${failedResponses[0].status}`);
      }
      
      console.log(`✅ Estado del agente actualizado correctamente para ${promises.length} teléfono(s)`);
      
      toast({
        title: "Estado actualizado",
        description: `El agente está ahora ${newAgentActive ? 'activo' : 'inactivo'} para ${cliente.phone_number_2 ? 'ambos teléfonos del' : 'este'} cliente.`
      });
      
      // Recargar los datos para reflejar el cambio en la UI
      if (onClienteDeleted) {
        onClienteDeleted();
      }
    } catch (error) {
      console.error("❌ Error actualizando estado del agente:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el estado del agente."
      });
    }
  };

  if (loading) {
    return <Skeleton className="h-[400px]" />
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Teléfono 2</TableHead>
            <TableHead>Estado Agente</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clientes.map((cliente) => (
            <TableRow key={cliente.id}>
              <TableCell>{cliente.names}</TableCell>
              <TableCell>{cliente.email}</TableCell>
              <TableCell>{cliente.phone_number}</TableCell>
              <TableCell>{cliente.phone_number_2 || '-'}</TableCell>
              <TableCell>
                <Button
                  variant={cliente.agent_active ? "default" : "destructive"}
                  size="sm"
                  onClick={() => toggleAgentStatus(cliente)}
                >
                  {cliente.agent_active ? 'Activo' : 'Inactivo'}
                </Button>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link href={`/backoffice/clientes/${cliente.id}?token=${token}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      Ver
                    </Button>
                  </Link>
                  <Link href={`/backoffice/clientes/${cliente.id}/editar?token=${token}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </Button>
                  </Link>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!clienteAEliminar} onOpenChange={() => setClienteAEliminar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar cliente?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el cliente
              {clienteAEliminar?.names} y todos sus datos asociados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setClienteAEliminar(null)}
              disabled={eliminando}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={eliminarCliente}
              disabled={eliminando}
            >
              {eliminando ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 