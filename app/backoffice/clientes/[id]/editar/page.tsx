"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getBaseUrl } from "@/lib/utils"
import { verifyToken } from '@/app/jwt/token'
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface PageProps {
  params: {
    id: string;
  };
}

export default function EditarClientePage({ params }: PageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  const [token, setToken] = useState<string>("");
  const [dataToken, setDataToken] = useState<object>({});
  const [formData, setFormData] = useState({
    names: "",
    email: "",
    phone_number: "",
    external_id: ""
  });
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setSearchParams(params);
    }
  }, []);

  useEffect(() => {
    if (searchParams) {
      const tokenValue = searchParams.get("token");
      if (tokenValue) {
        setToken(tokenValue);
        const verifiedDataToken = verifyToken(tokenValue);
        
        if (
          !verifiedDataToken ||
          typeof verifiedDataToken !== "object" ||
          Object.keys(verifiedDataToken).length === 0 ||
          !(verifiedDataToken as any).dealership_id
        ) {
          router.push("/login");
          return;
        }
        setDataToken(verifiedDataToken || {});

        // Cargar datos del cliente
        cargarDatosCliente();
      }
    }
  }, [searchParams, router]);

  const cargarDatosCliente = async () => {
    const supabase = createClientComponentClient();
    try {
      const { data: cliente, error } = await supabase
        .from('client')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;

      if (cliente) {
        setFormData({
          names: cliente.names || '',
          email: cliente.email || '',
          phone_number: cliente.phone_number || '',
          external_id: cliente.external_id || ''
        });
      }
    } catch (error) {
      console.error('Error al cargar cliente:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar los datos del cliente."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Verificar si hay un dealership_id en el token
      if (!dataToken || !(dataToken as any).dealership_id) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo determinar la agencia. Por favor, inicie sesión nuevamente."
        });
        return;
      }

      // Preparar payload solo con los campos editables
      const payload: any = {
        names: formData.names,
        email: formData.email,
        phone_number: formData.phone_number,
        external_id: formData.external_id || null
      };

      // Llamar a la API PATCH
      const response = await fetch(`/api/customers/update/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      console.log('🔍 Respuesta del endpoint:', {
        status: response.status,
        ok: response.ok,
        result: result,
        timestamp: new Date().toISOString()
      });

      if (!response.ok) {
        // Manejar diferentes tipos de errores
        let errorMessage = result.message || "No se pudo actualizar el cliente.";
        
        if (response.status === 409) {
          // Error de duplicado
          errorMessage = result.message || "Ya existe otro cliente con los mismos datos.";
        } else if (response.status === 400) {
          // Error de validación
          errorMessage = result.message || "Los datos proporcionados no son válidos.";
        } else if (response.status === 404) {
          // Cliente no encontrado
          errorMessage = "El cliente no fue encontrado.";
        } else if (response.status === 500) {
          // Error del servidor
          errorMessage = "Error interno del servidor. Por favor, intente más tarde.";
        }
        
        console.log('❌ Mostrando toast de error:', {
          status: response.status,
          errorMessage: errorMessage,
          timestamp: new Date().toISOString()
        });
        
        try {
          toast({
            variant: "destructive",
            title: "Error",
            description: errorMessage
          });
          console.log('✅ Toast llamado exitosamente');
        } catch (toastError) {
          console.error('❌ Error al mostrar toast:', toastError);
        }
        return;
      }

      console.log('✅ Mostrando toast de éxito');
      toast({
        title: "Cliente actualizado",
        description: "Los datos del cliente han sido actualizados exitosamente."
      });

      // Redirigir a la página de clientes con el token
      router.push(`/backoffice/clientes?token=${token}`);
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el cliente. Por favor, intente nuevamente."
      });
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    
    try {
      const response = await fetch(`/api/customers/delete/${params.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      console.log('🗑️ Respuesta de eliminación:', {
        status: response.status,
        ok: response.ok,
        result: result,
        timestamp: new Date().toISOString()
      });

      if (!response.ok) {
        let errorMessage = result.message || "No se pudo eliminar el cliente.";
        
        if (response.status === 409) {
          // Error de dependencias (citas o conversaciones)
          errorMessage = result.message || "No se puede eliminar el cliente porque tiene datos asociados.";
        } else if (response.status === 404) {
          errorMessage = "El cliente no fue encontrado.";
        } else if (response.status === 500) {
          errorMessage = "Error interno del servidor. Por favor, intente más tarde.";
        }
        
        toast({
          variant: "destructive",
          title: "Error",
          description: errorMessage
        });
        return;
      }

      toast({
        title: "Cliente eliminado",
        description: result.message || "El cliente ha sido eliminado exitosamente."
      });

      // Redirigir a la página de clientes
      router.push(`/backoffice/clientes?token=${token}`);
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el cliente. Por favor, intente nuevamente."
      });
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return <div className="p-8">Cargando...</div>;
  }

  return (
    <div className="space-y-4 p-8">
      <h2 className="text-2xl font-bold">Editar Cliente</h2>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div className="space-y-2">
          <Label htmlFor="names">Nombre</Label>
          <Input
            id="names"
            value={formData.names}
            onChange={(e) => setFormData({ ...formData, names: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email (opcional)</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone_number">Teléfono</Label>
          <Input
            id="phone_number"
            value={formData.phone_number}
            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="external_id">External ID (opcional)</Label>
          <Input
            id="external_id"
            value={formData.external_id}
            onChange={(e) => setFormData({ ...formData, external_id: e.target.value })}
            placeholder="ID externo del cliente"
          />
        </div>
        <div className="flex gap-4">
          <Button type="submit">Guardar Cambios</Button>
          <Button 
            type="button" 
            variant="outline"
            onClick={() => router.push(`/backoffice/clientes?token=${token}`)}
          >
            Cancelar
          </Button>
          <Button 
            type="button" 
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleting}
          >
            {deleting ? "Eliminando..." : "Eliminar Cliente"}
          </Button>
        </div>
      </form>

      {/* Diálogo de confirmación de eliminación */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar al cliente "{formData.names}"? 
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Eliminando..." : "Sí, eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 