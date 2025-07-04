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
import { Search, Plus, Edit, Trash2, Loader2, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// UUID de la agencia autorizada para plataforma
const PLATFORM_AGENCY_ID = '6b58f82d-baa6-44ce-9941-1a61975d20b5';

interface Worker {
  id: number;
  email: string;
  names: string;
  surnames: string;
  active: boolean;
  created_at: string;
  last_updated: string;
  dealership_id: string;
  dealerships: {
    name: string;
  };
}

interface Agency {
  id: string;
  name: string;
}

export default function PlataformaUsuariosPage() {
  const router = useRouter();
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  const [token, setToken] = useState<string>("");
  const [dataToken, setDataToken] = useState<any>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  
  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroAgencia, setFiltroAgencia] = useState("todas");

  // Formulario
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    names: "",
    surnames: "",
    dealership_id: "",
    active: true
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
      cargarUsuarios();
      cargarAgencias();
    }
  }, [dataToken, busqueda, filtroEstado, filtroAgencia]);

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (filtroEstado !== "todos") {
        params.append('active', filtroEstado === "activos" ? 'true' : 'false');
      }

      if (filtroAgencia !== "todas") {
        params.append('dealership_id', filtroAgencia);
      }

      if (busqueda) {
        params.append('search', busqueda);
      }

      const response = await fetch(`/api/backoffice/plataforma/workers?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar usuarios');
      }

      const data = await response.json();
      setWorkers(data.workers || []);
    } catch (error) {
      console.error('❌ Error cargando usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarAgencias = async () => {
    try {
      const response = await fetch('/api/backoffice/plataforma/agencies', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAgencies(data.agencies || []);
      }
    } catch (error) {
      console.error('❌ Error cargando agencias:', error);
    }
  };

  const handleCreateUser = async () => {
    if (!formData.email || !formData.password || !formData.names || !formData.surnames || !formData.dealership_id) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/backoffice/plataforma/workers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear usuario');
      }

      // Limpiar formulario y cerrar modal
      setFormData({ email: "", password: "", names: "", surnames: "", dealership_id: "", active: true });
      setIsCreateDialogOpen(false);
      setShowPassword(false);
      
      // Recargar usuarios
      await cargarUsuarios();
      
      console.log('✅ Usuario creado exitosamente');
    } catch (error) {
      console.error('❌ Error creando usuario:', error);
      alert(error instanceof Error ? error.message : 'Error al crear usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = async () => {
    if (!editingWorker || !formData.names || !formData.surnames || !formData.dealership_id) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/backoffice/plataforma/workers/${editingWorker.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar usuario');
      }

      // Limpiar formulario y cerrar modal
      setFormData({ email: "", password: "", names: "", surnames: "", dealership_id: "", active: true });
      setIsEditDialogOpen(false);
      setEditingWorker(null);
      setShowEditPassword(false);
      
      // Recargar usuarios
      await cargarUsuarios();
      
      console.log('✅ Usuario actualizado exitosamente');
    } catch (error) {
      console.error('❌ Error actualizando usuario:', error);
      alert(error instanceof Error ? error.message : 'Error al actualizar usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (workerId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await fetch(`/api/backoffice/plataforma/workers/${workerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar usuario');
      }

      // Recargar usuarios
      await cargarUsuarios();
      
      console.log('✅ Usuario eliminado exitosamente');
    } catch (error) {
      console.error('❌ Error eliminando usuario:', error);
      alert(error instanceof Error ? error.message : 'Error al eliminar usuario');
    }
  };

  const openCreateDialog = () => {
    setFormData({ email: "", password: "", names: "", surnames: "", dealership_id: "", active: true });
    setIsCreateDialogOpen(true);
    setShowPassword(false);
  };

  const openEditDialog = (worker: Worker) => {
    setEditingWorker(worker);
    setFormData({
      email: worker.email,
      password: "",
      names: worker.names,
      surnames: worker.surnames,
      dealership_id: worker.dealership_id,
      active: worker.active
    });
    setIsEditDialogOpen(true);
    setShowEditPassword(false);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es });
    } catch {
      return 'Fecha inválida';
    }
  };

  const getAgencyName = (dealershipId: string) => {
    const agency = agencies.find(a => a.id === dealershipId);
    return agency ? agency.name : 'Agencia no encontrada';
  };

  if (!dataToken) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
        <Button onClick={openCreateDialog} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Filtros */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nombre, apellido o email..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Estado</label>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="activos">Activos</SelectItem>
                <SelectItem value="inactivos">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Agencia</label>
            <Select value={filtroAgencia} onValueChange={setFiltroAgencia}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las agencias</SelectItem>
                {agencies.map((agency) => (
                  <SelectItem key={agency.id} value={agency.id}>
                    {agency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Tabla de usuarios */}
      <Card>
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Agencia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No se encontraron usuarios
                    </TableCell>
                  </TableRow>
                ) : (
                  workers.map((worker) => (
                    <TableRow key={worker.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{worker.names} {worker.surnames}</div>
                        </div>
                      </TableCell>
                      <TableCell>{worker.email}</TableCell>
                      <TableCell>{getAgencyName(worker.dealership_id)}</TableCell>
                      <TableCell>
                        <Badge variant={worker.active ? "default" : "secondary"}>
                          {worker.active ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(worker.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(worker)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(worker.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>

      {/* Modal Crear Usuario */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Completa la información del nuevo usuario de agencia.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nombres *</label>
                <Input
                  value={formData.names}
                  onChange={(e) => setFormData({ ...formData, names: e.target.value })}
                  placeholder="Nombres"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Apellidos *</label>
                <Input
                  value={formData.surnames}
                  onChange={(e) => setFormData({ ...formData, surnames: e.target.value })}
                  placeholder="Apellidos"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Email *</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="usuario@ejemplo.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Contraseña *</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Contraseña"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Agencia *</label>
              <Select 
                value={formData.dealership_id} 
                onValueChange={(value) => setFormData({ ...formData, dealership_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar agencia" />
                </SelectTrigger>
                <SelectContent>
                  {agencies.map((agency) => (
                    <SelectItem key={agency.id} value={agency.id}>
                      {agency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="active" className="text-sm font-medium">
                Usuario activo
              </label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateUser} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear Usuario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Usuario */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica la información del usuario.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nombres *</label>
                <Input
                  value={formData.names}
                  onChange={(e) => setFormData({ ...formData, names: e.target.value })}
                  placeholder="Nombres"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Apellidos *</label>
                <Input
                  value={formData.surnames}
                  onChange={(e) => setFormData({ ...formData, surnames: e.target.value })}
                  placeholder="Apellidos"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="usuario@ejemplo.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Nueva Contraseña (opcional)</label>
              <div className="relative">
                <Input
                  type={showEditPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Dejar vacío para mantener la actual"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowEditPassword(!showEditPassword)}
                >
                  {showEditPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Agencia *</label>
              <Select 
                value={formData.dealership_id} 
                onValueChange={(value) => setFormData({ ...formData, dealership_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar agencia" />
                </SelectTrigger>
                <SelectContent>
                  {agencies.map((agency) => (
                    <SelectItem key={agency.id} value={agency.id}>
                      {agency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="edit-active" className="text-sm font-medium">
                Usuario activo
              </label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditUser} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Actualizar Usuario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 