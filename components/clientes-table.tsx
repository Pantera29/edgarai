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
  external_id?: string | null
  agent_active: boolean
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
      
      const { error } = await supabase
        .from('client')
        .update({ agent_active: !cliente.agent_active })
        .eq('id', cliente.id);
      
      if (error) throw error;
      
      console.log('✅ Estado del agente actualizado correctamente');
      
      toast({
        title: "Estado actualizado",
        description: `El agente está ahora ${!cliente.agent_active ? 'activo' : 'inactivo'} para este cliente.`
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
            <TableHead>External ID</TableHead>
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
              <TableCell>{cliente.external_id || '-'}</TableCell>
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