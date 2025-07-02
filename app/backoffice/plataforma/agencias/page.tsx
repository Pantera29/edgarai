"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { verifyToken } from "../../../jwt/token";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Edit, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// UUID de la agencia autorizada para plataforma
const PLATFORM_AGENCY_ID = '6b58f82d-baa6-44ce-9941-1a61975d20b5';

interface Agency {
  id: string;
  name: string;
  address?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function PlataformaAgenciasPage() {
  const router = useRouter();
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  const [token, setToken] = useState<string>("");
  const [dataToken, setDataToken] = useState<any>(null);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  // Formulario
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    is_active: true
  });

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

        // Verificar que es la agencia autorizada para plataforma
        if (verifiedDataToken.dealership_id !== PLATFORM_AGENCY_ID) {
          router.push(`/backoffice?token=${tokenValue}`);
          return;
        }
        
        setDataToken(verifiedDataToken || {});
      }
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (dataToken) {
      cargarAgencias();
    }
  }, [dataToken, busqueda, filtroEstado]);

  const cargarAgencias = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('dealerships')
        .select('*')
        .order('name');

      // Aplicar filtros
      if (filtroEstado !== "todos") {
        query = query.eq('is_active', filtroEstado === "activas");
      }

      if (busqueda) {
        query = query.ilike('name', `%${busqueda}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error cargando agencias:', error);
        return;
      }

      setAgencies(data || []);
    } catch (error) {
      console.error('Error cargando agencias:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgency = async () => {
    if (!formData.name.trim()) {
      alert('Por favor completa el nombre de la agencia');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/backoffice/plataforma/agencies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear agencia');
      }

      // Limpiar formulario y cerrar modal
      setFormData({ name: "", address: "", is_active: true });
      setIsCreateDialogOpen(false);
      
      // Recargar agencias
      await cargarAgencias();
      
      console.log('✅ Agencia creada exitosamente');
    } catch (error) {
      console.error('❌ Error creando agencia:', error);
      alert(error instanceof Error ? error.message : 'Error al crear agencia');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAgency = async () => {
    if (!editingAgency || !formData.name.trim()) {
      alert('Por favor completa el nombre de la agencia');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/backoffice/plataforma/agencies/${editingAgency.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar agencia');
      }

      // Limpiar formulario y cerrar modal
      setFormData({ name: "", phone: "", is_active: true });
      setEditingAgency(null);
      setIsEditDialogOpen(false);
      
      // Recargar agencias
      await cargarAgencias();
      
      console.log('✅ Agencia actualizada exitosamente');
    } catch (error) {
      console.error('❌ Error actualizando agencia:', error);
      alert(error instanceof Error ? error.message : 'Error al actualizar agencia');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (agency: Agency) => {
    setEditingAgency(agency);
    setFormData({
      name: agency.name,
      address: agency.address || "",
      is_active: agency.is_active
    });
    setIsEditDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es });
    } catch (error) {
      return "Fecha inválida";
    }
  };

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Administración - Agencias</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Agencia
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Agencia</DialogTitle>
              <DialogDescription>
                Completa los datos para crear una nueva agencia en el sistema.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nombre *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nombre de la agencia"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Dirección</label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Dirección de la agencia"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Estado</label>
                <Select
                  value={formData.is_active ? "activa" : "inactiva"}
                  onValueChange={(value) => setFormData({ ...formData, is_active: value === "activa" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activa">Activa</SelectItem>
                    <SelectItem value="inactiva">Inactiva</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button onClick={handleCreateAgency} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  'Crear Agencia'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-4 shadow-sm border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre..."
              className="pl-8"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          
          <Select
            value={filtroEstado}
            onValueChange={setFiltroEstado}
          >
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas</SelectItem>
              <SelectItem value="activas">Activas</SelectItem>
              <SelectItem value="inactivas">Inactivas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Creada</TableHead>
              <TableHead>Actualizada</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  Cargando agencias...
                </TableCell>
              </TableRow>
            ) : agencies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  No se encontraron agencias
                </TableCell>
              </TableRow>
            ) : (
              agencies.map((agency) => (
                <TableRow key={agency.id}>
                  <TableCell className="font-medium">
                    {agency.name}
                  </TableCell>
                  <TableCell>
                    {agency.address || "-"}
                  </TableCell>
                  <TableCell>
                    {agency.is_active ? (
                      <Badge className="bg-green-500">Activa</Badge>
                    ) : (
                      <Badge variant="secondary">Inactiva</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {formatDate(agency.created_at)}
                  </TableCell>
                  <TableCell>
                    {formatDate(agency.updated_at)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(agency)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal de edición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Agencia</DialogTitle>
            <DialogDescription>
              Modifica los datos de la agencia seleccionada.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nombre *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre de la agencia"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Dirección</label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Dirección de la agencia"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Estado</label>
              <Select
                value={formData.is_active ? "activa" : "inactiva"}
                onValueChange={(value) => setFormData({ ...formData, is_active: value === "activa" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activa">Activa</SelectItem>
                  <SelectItem value="inactiva">Inactiva</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handleEditAgency} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Actualizando...
                </>
              ) : (
                'Actualizar Agencia'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 