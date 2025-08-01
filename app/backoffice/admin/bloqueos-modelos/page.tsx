'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Car, Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { verifyToken } from '@/app/jwt/token';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import ModelBlockDialog from './model-block-dialog';

interface ModelBlockedDate {
  id: string;
  dealership_id: string;
  make: string;
  model: string;
  start_date: string;
  end_date: string;
  reason: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function ModelBlockedDates() {
  const [blockedDates, setBlockedDates] = useState<ModelBlockedDate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ModelBlockedDate | null>(null);
  const supabase = createClientComponentClient();
  const router = useRouter();

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Obtener el dealership_id del token
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      if (!token) {
        toast({
          title: '¡Error!',
          description: 'No se encontró el token de autenticación',
          variant: 'destructive'
        });
        return;
      }

      const verifiedData = verifyToken(token);
      if (
        !verifiedData ||
        typeof verifiedData !== "object" ||
        Object.keys(verifiedData).length === 0 ||
        !(verifiedData as any).dealership_id
      ) {
        router.push("/login");
        return;
      }

      // Cargar bloqueos por modelo usando API
      const response = await fetch(`/api/model-blocked-dates?dealership_id=${verifiedData.dealership_id}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar bloqueos por modelo');
      }

      const data = await response.json();
      setBlockedDates(data.blockedDates || []);

    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast({
        title: '¡Error!',
        description: 'Error al cargar la información',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEdit = (block: ModelBlockedDate) => {
    setEditingBlock(block);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este bloqueo?')) {
      return;
    }

    try {
      const response = await fetch(`/api/model-blocked-dates/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar bloqueo');
      }

      toast({
        title: '¡Éxito!',
        description: 'Bloqueo eliminado correctamente',
        variant: 'default'
      });

      loadData();
    } catch (error) {
      console.error('Error al eliminar bloqueo:', error);
      toast({
        title: '¡Error!',
        description: 'Error al eliminar el bloqueo',
        variant: 'destructive'
      });
    }
  };

  const handleSave = () => {
    setDialogOpen(false);
    setEditingBlock(null);
    loadData();
  };

  const getStatusBadge = (block: ModelBlockedDate) => {
    const today = new Date();
    const endDate = new Date(block.end_date);
    
    if (!block.is_active) {
      return <Badge variant="secondary">Inactivo</Badge>;
    }
    
    if (endDate < today) {
      return <Badge variant="destructive">Expirado</Badge>;
    }
    
    return <Badge variant="default">Activo</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bloqueos por Modelo</h1>
          <p className="text-gray-600 mt-2">
            Gestiona los bloqueos de calendario para modelos específicos de vehículos
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Bloqueo
        </Button>
      </div>

      {blockedDates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay bloqueos configurados
            </h3>
            <p className="text-gray-600 text-center mb-4">
              Crea tu primer bloqueo por modelo para restringir citas de vehículos específicos
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              Crear Primer Bloqueo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {blockedDates.map((block) => (
            <Card key={block.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Car className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {block.make} {block.model}
                      </h3>
                      {getStatusBadge(block)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(parseISO(block.start_date), 'dd/MM/yyyy', { locale: es })} - {format(parseISO(block.end_date), 'dd/MM/yyyy', { locale: es })}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-700">{block.reason}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(block)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(block.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ModelBlockDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingBlock={editingBlock}
        onSave={handleSave}
      />
    </div>
  );
} 