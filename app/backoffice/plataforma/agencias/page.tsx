"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
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
import { Search, Plus, Edit, Loader2, Wrench, Settings } from "lucide-react";
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

interface VehicleMake {
  id: string;
  name: string;
}

interface DealershipBrand {
  make_id: string;
  vehicle_makes: VehicleMake;
}

interface DealershipMapping {
  id: string;
  dealership_id: string;
  phone_number: string;
  whapi_id?: string;
  created_at: string;
}

interface AgencyConfigContentProps {
  agency: Agency;
  token: string;
  onClose: () => void;
}

function AgencyConfigContent({ agency, token, onClose }: AgencyConfigContentProps) {
  const [activeTab, setActiveTab] = useState<'brands' | 'mapping'>('brands');
  const [brands, setBrands] = useState<DealershipBrand[]>([]);
  const [allBrands, setAllBrands] = useState<VehicleMake[]>([]);
  const [mappings, setMappings] = useState<DealershipMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newMapping, setNewMapping] = useState({ phone_number: '', whapi_id: '' });
  
  // Estados para cambios pendientes
  const [pendingBrandChanges, setPendingBrandChanges] = useState<Set<string>>(new Set());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    loadData();
  }, [agency.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const supabase = createClientComponentClient();
      
      // Cargar marcas configuradas para la agencia
      const { data: brandsData } = await supabase
        .from('dealership_brands')
        .select(`
          make_id,
          vehicle_makes!inner (
            id,
            name
          )
        `)
        .eq('dealership_id', agency.id);

      // Cargar todas las marcas disponibles
      const { data: allBrandsData } = await supabase
        .from('vehicle_makes')
        .select('id, name')
        .order('name');

      // Cargar mapeos de teléfono
      const { data: mappingsData } = await supabase
        .from('dealership_mapping')
        .select('*')
        .eq('dealership_id', agency.id)
        .order('created_at');

      setBrands((brandsData as unknown as DealershipBrand[]) || []);
      setAllBrands(allBrandsData || []);
      setMappings(mappingsData || []);
    } catch (error) {
      console.error('Error cargando configuración:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBrandToggle = async (makeId: string, isEnabled: boolean) => {
    // En lugar de guardar automáticamente, marcar como cambio pendiente
    const newPendingChanges = new Set(pendingBrandChanges);
    
    if (isEnabled) {
      // Si se está habilitando, agregar a cambios pendientes
      newPendingChanges.add(makeId);
    } else {
      // Si se está deshabilitando, agregar a cambios pendientes (con prefijo para distinguir)
      newPendingChanges.add(`disable_${makeId}`);
    }
    
    setPendingBrandChanges(newPendingChanges);
    setHasUnsavedChanges(true);
    
    // Actualizar la UI inmediatamente para feedback visual
    if (isEnabled) {
      // Agregar marca a la lista local
      const brandToAdd = allBrands.find(b => b.id === makeId);
      if (brandToAdd) {
        setBrands(prev => [...prev, { make_id: makeId, vehicle_makes: brandToAdd }]);
      }
    } else {
      // Remover marca de la lista local
      setBrands(prev => prev.filter(b => b.make_id !== makeId));
    }
  };

  const saveChanges = async () => {
    if (pendingBrandChanges.size === 0) return;
    
    setSaving(true);
    try {
      const supabase = createClientComponentClient();
      
      // Procesar cada cambio pendiente
      for (const change of pendingBrandChanges) {
        if (change.startsWith('disable_')) {
          // Deshabilitar marca
          const makeId = change.replace('disable_', '');
          await supabase
            .from('dealership_brands')
            .delete()
            .eq('dealership_id', agency.id)
            .eq('make_id', makeId);
        } else {
          // Habilitar marca
          await supabase
            .from('dealership_brands')
            .insert({ dealership_id: agency.id, make_id: change });
        }
      }
      
      // Limpiar cambios pendientes
      setPendingBrandChanges(new Set());
      setHasUnsavedChanges(false);
      
      // Recargar datos para asegurar sincronización
      await loadData();
      
      console.log('✅ Configuración de marcas guardada exitosamente');
    } catch (error) {
      console.error('❌ Error guardando cambios:', error);
      alert('Error al guardar los cambios. Por favor, intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      const confirmed = confirm('Tienes cambios sin guardar. ¿Estás seguro de que quieres cerrar sin guardar?');
      if (!confirmed) return;
    }
    onClose();
  };

  const handleAddMapping = async () => {
    if (!newMapping.phone_number.trim()) {
      alert('Por favor ingresa un número de teléfono');
      return;
    }

    setSaving(true);
    try {
      const supabase = createClientComponentClient();
      
      await supabase
        .from('dealership_mapping')
        .insert({
          dealership_id: agency.id,
          phone_number: newMapping.phone_number,
          whapi_id: newMapping.whapi_id || null
        });
      
      setNewMapping({ phone_number: '', whapi_id: '' });
      await loadData();
      console.log('✅ Mapeo agregado exitosamente');
    } catch (error) {
      console.error('❌ Error agregando mapeo:', error);
      alert('Error al agregar mapeo');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMapping = async (mappingId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este mapeo?')) return;

    setSaving(true);
    try {
      const supabase = createClientComponentClient();
      
      await supabase
        .from('dealership_mapping')
        .delete()
        .eq('id', mappingId);
      
      await loadData();
      console.log('✅ Mapeo eliminado exitosamente');
    } catch (error) {
      console.error('❌ Error eliminando mapeo:', error);
      alert('Error al eliminar mapeo');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Cargando configuración...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex border-b">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'brands' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('brands')}
        >
          Marcas de Vehículos
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'mapping' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('mapping')}
        >
          Mapeos de Teléfono
        </button>
      </div>

      {/* Tab de Marcas */}
      {activeTab === 'brands' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Marcas Permitidas</h3>
            <div className="flex items-center gap-3">
              <p className="text-sm text-gray-500">
                {brands.length} de {allBrands.length} marcas habilitadas
              </p>
              {hasUnsavedChanges && (
                <span className="text-sm text-orange-600 font-medium">
                  • Cambios pendientes
                </span>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
            {allBrands.map((brand) => {
              const isEnabled = brands.some(b => b.make_id === brand.id);
              return (
                <div
                  key={brand.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    isEnabled 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                  onClick={() => handleBrandToggle(brand.id, !isEnabled)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{brand.name}</span>
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      isEnabled 
                        ? 'bg-green-500 border-green-500' 
                        : 'border-gray-300'
                    }`}>
                      {isEnabled && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Botón de guardar cambios */}
          {hasUnsavedChanges && (
            <div className="flex justify-end pt-4 border-t">
              <Button 
                onClick={saveChanges} 
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Cambios'
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Tab de Mapeos */}
      {activeTab === 'mapping' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Mapeos de Teléfono</h3>
            <p className="text-sm text-gray-500">
              {mappings.length} mapeos configurados
            </p>
          </div>

          {/* Formulario para agregar mapeo */}
          <div className="p-4 border rounded-lg bg-gray-50">
            <h4 className="font-medium mb-3">Agregar Nuevo Mapeo</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Número de Teléfono *</label>
                <Input
                  value={newMapping.phone_number}
                  onChange={(e) => setNewMapping({ ...newMapping, phone_number: e.target.value })}
                  placeholder="525512345678"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Whapi ID (opcional)</label>
                <Input
                  value={newMapping.whapi_id}
                  onChange={(e) => setNewMapping({ ...newMapping, whapi_id: e.target.value })}
                  placeholder="ID de WhatsApp"
                />
              </div>
            </div>
            <Button 
              onClick={handleAddMapping} 
              disabled={saving || !newMapping.phone_number.trim()}
              className="mt-3"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Agregando...
                </>
              ) : (
                'Agregar Mapeo'
              )}
            </Button>
          </div>

          {/* Lista de mapeos existentes */}
          <div className="space-y-2">
            {mappings.map((mapping) => (
              <div key={mapping.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{mapping.phone_number}</p>
                  {mapping.whapi_id && (
                    <p className="text-sm text-gray-500">Whapi ID: {mapping.whapi_id}</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteMapping(mapping.id)}
                  disabled={saving}
                >
                  Eliminar
                </Button>
              </div>
            ))}
            
            {mappings.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No hay mapeos configurados para esta agencia
              </div>
            )}
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={handleClose}>
          Cerrar
        </Button>
      </div>
    </div>
  );
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
  const [isFixingWorkshops, setIsFixingWorkshops] = useState(false);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [configuringAgency, setConfiguringAgency] = useState<Agency | null>(null);
  
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
      setFormData({ name: "", address: "", is_active: true });
      setIsEditDialogOpen(false);
      setEditingAgency(null);
      
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

  const openConfigDialog = (agency: Agency) => {
    setConfiguringAgency(agency);
    setIsConfigDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es });
    } catch (error) {
      return "Fecha inválida";
    }
  };

  const handleFixWorkshops = async () => {
    setIsFixingWorkshops(true);
    try {
      const response = await fetch('/api/backoffice/plataforma/agencies/fix-workshops', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al corregir workshops');
      }

      const result = await response.json();
      console.log('✅ Workshops corregidos:', result);
      alert(`Corrección completada:\n- Procesadas: ${result.summary.total_processed}\n- Creados: ${result.summary.workshops_created}\n- Omitidas: ${result.summary.workshops_skipped}\n- Errores: ${result.summary.errors}`);
    } catch (error) {
      console.error('❌ Error corrigiendo workshops:', error);
      alert(error instanceof Error ? error.message : 'Error al corregir workshops');
    } finally {
      setIsFixingWorkshops(false);
    }
  };

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Administración - Agencias</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleFixWorkshops}
            disabled={isFixingWorkshops}
          >
            {isFixingWorkshops ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Corrigiendo...
              </>
            ) : (
              <>
                <Wrench className="h-4 w-4 mr-2" />
                Corregir Workshops
              </>
            )}
          </Button>
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
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(agency)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openConfigDialog(agency)}
                        className="flex items-center gap-1"
                      >
                        <Settings className="h-4 w-4" />
                        Configurar
                      </Button>
                    </div>
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

      {/* Modal de configuración */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configuración - {configuringAgency?.name}</DialogTitle>
            <DialogDescription>
              Gestiona las marcas de vehículos y mapeos de teléfono para esta agencia.
            </DialogDescription>
          </DialogHeader>
          
          {configuringAgency && (
            <AgencyConfigContent 
              agency={configuringAgency} 
              token={token}
              onClose={() => setIsConfigDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 