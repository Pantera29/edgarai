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
import { MoreHorizontal, History, Edit, Trash2 } from "lucide-react"
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
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clientes.map((cliente) => (
            <TableRow key={cliente.id}>
              <TableCell>{cliente.names}</TableCell>
              <TableCell>{cliente.email}</TableCell>
              <TableCell>{cliente.phone_number}</TableCell>
              <TableCell className="text-right">
                <Link href={`/backoffice/clientes/${cliente.id}/editar?token=${token}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                  >
                    Editar
                  </Button>
                </Link>
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