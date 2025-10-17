"use client";

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardDescription, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { verifyToken } from '@/app/jwt/token';
import { Plus, Eye, Send, Trash2, Edit, Loader2, MessageSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TemplateFormDialog } from './components/template-form-dialog';

interface WhatsAppTemplate {
  id: string;
  kapso_template_id: string | null;
  name: string;
  language_code: string;
  category: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'disabled';
  body_text: string;
  header_text: string | null;
  footer_text: string | null;
  components: any;
  parameter_format: string;
  parameter_count: number;
  dealership_id: string;
  whatsapp_config_id: string;
  created_at: string;
  updated_at: string;
}

export default function TemplatesWhatsAppPage() {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [dealershipId, setDealershipId] = useState<string | null>(null);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<WhatsAppTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [viewTemplate, setViewTemplate] = useState<WhatsAppTemplate | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) {
      toast({
        title: 'Error',
        description: 'No se encontró el token de autenticación',
        variant: 'destructive',
      });
      return;
    }

    const verifiedData = verifyToken(token);
    if (!verifiedData || typeof verifiedData !== "object" || !verifiedData.dealership_id) {
      toast({
        title: 'Error',
        description: 'Token inválido',
        variant: 'destructive',
      });
      return;
    }

    setDealershipId(verifiedData.dealership_id);
  }, []);

  useEffect(() => {
    if (dealershipId) {
      fetchTemplates();
    }
  }, [dealershipId]);

  const fetchTemplates = async () => {
    if (!dealershipId) return;
    
    setLoading(true);
    try {
      const supabase = createClientComponentClient();
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('dealership_id', dealershipId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      console.error('Error al cargar templates:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los templates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any; emoji: string }> = {
      draft: { label: 'Borrador', variant: 'secondary', emoji: '📝' },
      submitted: { label: 'En Revisión', variant: 'default', emoji: '🔄' },
      approved: { label: 'Aprobado', variant: 'default', emoji: '✅' },
      rejected: { label: 'Rechazado', variant: 'destructive', emoji: '❌' },
      disabled: { label: 'Deshabilitado', variant: 'outline', emoji: '⏸️' },
    };

    const config = statusConfig[status] || statusConfig.draft;
    return (
      <Badge variant={config.variant} className={
        status === 'approved' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
        status === 'submitted' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' :
        ''
      }>
        <span className="mr-1">{config.emoji}</span>
        {config.label}
      </Badge>
    );
  };

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      MARKETING: 'Marketing',
      UTILITY: 'Utilidad',
      AUTHENTICATION: 'Autenticación',
    };
    return categories[category] || category;
  };

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setShowFormDialog(true);
  };

  const handleEdit = (template: WhatsAppTemplate) => {
    setSelectedTemplate(template);
    setShowFormDialog(true);
  };

  const handleView = (template: WhatsAppTemplate) => {
    setViewTemplate(template);
    setShowViewDialog(true);
  };

  const handleDelete = (template: WhatsAppTemplate) => {
    setTemplateToDelete(template);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!templateToDelete) return;

    setIsDeleting(true);
    try {
      const supabase = createClientComponentClient();
      const { error } = await supabase
        .from('whatsapp_templates')
        .delete()
        .eq('id', templateToDelete.id);

      if (error) throw error;

      toast({
        title: '✅ Template eliminado',
        description: 'El template ha sido eliminado correctamente',
      });

      await fetchTemplates();
      setShowDeleteDialog(false);
      setTemplateToDelete(null);
    } catch (error: any) {
      console.error('Error al eliminar template:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el template',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmitForApproval = async (template: WhatsAppTemplate) => {
    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      const response = await fetch(`/api/whatsapp/templates/${template.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        console.error('❌ [Frontend] Error del servidor:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        
        // Mostrar toast de error con más detalles
        const errorMessage = errorData.error || errorData.details || 'No se pudo enviar el template a Kapso';
        console.log('🔔 Mostrando toast de error:', errorMessage);
        
        toast({
          title: '❌ Error al enviar a aprobar',
          description: errorMessage,
          variant: 'destructive',
        });
        return; // Salir sin continuar
      }

      const data = await response.json();
      console.log('✅ Template enviado exitosamente:', data);

      toast({
        title: '✅ Template enviado a aprobar',
        description: 'El template ha sido enviado a WhatsApp para aprobación',
      });

      await fetchTemplates();
    } catch (error: any) {
      console.error('❌ Error inesperado al enviar a aprobar:', error);
      toast({
        title: '❌ Error',
        description: error.message || 'No se pudo enviar el template a aprobar',
        variant: 'destructive',
      });
    }
  };

  const handleFormSuccess = () => {
    setShowFormDialog(false);
    setSelectedTemplate(null);
    fetchTemplates();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Templates de WhatsApp</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona los templates de mensajes para WhatsApp Business
          </p>
        </div>
        <Button onClick={handleCreateNew} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Crear Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <MessageSquare className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No hay templates creados</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Crea tu primer template de WhatsApp para enviar mensajes pre-aprobados a tus clientes
            </p>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Primer Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Idioma
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Creación
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {templates.map((template) => (
                    <tr key={template.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{template.name}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {template.body_text}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {getCategoryLabel(template.category)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{template.language_code}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(template.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(template.created_at).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(template)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {template.status === 'draft' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(template)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSubmitForApproval(template)}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(template)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de creación/edición */}
      {showFormDialog && (
        <TemplateFormDialog
          open={showFormDialog}
          onClose={() => {
            setShowFormDialog(false);
            setSelectedTemplate(null);
          }}
          onSuccess={handleFormSuccess}
          template={selectedTemplate}
          dealershipId={dealershipId!}
        />
      )}

      {/* Dialog de confirmación de eliminación */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar template?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. El template "{templateToDelete?.name}" será eliminado permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de vista de template */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewTemplate?.name}
              {viewTemplate && getStatusBadge(viewTemplate.status)}
            </DialogTitle>
            <DialogDescription>
              Vista detallada del template
            </DialogDescription>
          </DialogHeader>
          
          {viewTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Categoría</label>
                  <p className="text-sm text-gray-900">{getCategoryLabel(viewTemplate.category)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Idioma</label>
                  <p className="text-sm text-gray-900">{viewTemplate.language_code}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Formato de Parámetros</label>
                  <p className="text-sm text-gray-900">{viewTemplate.parameter_format}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Cantidad de Parámetros</label>
                  <p className="text-sm text-gray-900">{viewTemplate.parameter_count}</p>
                </div>
              </div>

              {viewTemplate.header_text && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Encabezado</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{viewTemplate.header_text}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">Cuerpo del Mensaje</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{viewTemplate.body_text}</p>
                </div>
              </div>

              {viewTemplate.footer_text && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Pie de Página</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-500 whitespace-pre-wrap text-xs">{viewTemplate.footer_text}</p>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="bg-white border rounded-lg p-4 max-w-sm">
                  <div className="text-xs text-gray-500 mb-2">Vista Previa WhatsApp</div>
                  <div className="bg-green-50 rounded-lg p-3 space-y-2">
                    {viewTemplate.header_text && (
                      <div className="font-semibold text-sm">{viewTemplate.header_text}</div>
                    )}
                    <div className="text-sm whitespace-pre-wrap">{viewTemplate.body_text}</div>
                    {viewTemplate.footer_text && (
                      <div className="text-xs text-gray-500">{viewTemplate.footer_text}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowViewDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

