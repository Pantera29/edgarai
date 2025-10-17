"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface WhatsAppTemplate {
  id: string;
  name: string;
  language_code: string;
  category: string;
  status: string;
  body_text: string;
  header_text: string | null;
  footer_text: string | null;
  parameter_format: string;
}

interface TemplateFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  template: WhatsAppTemplate | null;
  dealershipId: string;
}

export function TemplateFormDialog({
  open,
  onClose,
  onSuccess,
  template,
  dealershipId,
}: TemplateFormDialogProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    language_code: 'es_MX',
    category: 'UTILITY',
    parameter_format: 'NAMED',
    header_text: '',
    body_text: '',
    footer_text: '',
  });

  const [showHeader, setShowHeader] = useState(false);
  const [showFooter, setShowFooter] = useState(false);

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        language_code: template.language_code,
        category: template.category,
        parameter_format: template.parameter_format || 'NAMED',
        header_text: template.header_text || '',
        body_text: template.body_text,
        footer_text: template.footer_text || '',
      });
      setShowHeader(!!template.header_text);
      setShowFooter(!!template.footer_text);
    } else {
      // Reset form for new template
      setFormData({
        name: '',
        language_code: 'es_MX',
        category: 'UTILITY',
        parameter_format: 'NAMED',
        header_text: '',
        body_text: '',
        footer_text: '',
      });
      setShowHeader(false);
      setShowFooter(false);
    }
  }, [template, open]);

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre del template es requerido',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.body_text.trim()) {
      toast({
        title: 'Error',
        description: 'El cuerpo del mensaje es requerido',
        variant: 'destructive',
      });
      return false;
    }

    // Validar que el nombre solo contenga letras, números y guiones bajos (requisito de WhatsApp)
    const nameRegex = /^[a-z0-9_]+$/;
    if (!nameRegex.test(formData.name)) {
      toast({
        title: 'Error',
        description: 'El nombre solo puede contener letras minúsculas, números y guiones bajos',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const countParameters = (text: string, format: string) => {
    if (format === 'NAMED') {
      const matches = text.match(/\{\{[a-zA-Z_][a-zA-Z0-9_]*\}\}/g);
      return matches ? new Set(matches).size : 0;
    } else {
      const matches = text.match(/\{\{\d+\}\}/g);
      return matches ? new Set(matches).size : 0;
    }
  };

  const buildComponents = () => {
    const components: any[] = [];

    // Header component
    if (showHeader && formData.header_text.trim()) {
      components.push({
        type: 'HEADER',
        format: 'TEXT',
        text: formData.header_text.trim(),
      });
    }

    // Body component (always required)
    components.push({
      type: 'BODY',
      text: formData.body_text.trim(),
    });

    // Footer component
    if (showFooter && formData.footer_text.trim()) {
      components.push({
        type: 'FOOTER',
        text: formData.footer_text.trim(),
      });
    }

    return components;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      const components = buildComponents();
      const allText = [formData.header_text, formData.body_text, formData.footer_text]
        .filter(Boolean)
        .join(' ');
      const parameterCount = countParameters(allText, formData.parameter_format);

      const payload = {
        name: formData.name,
        language_code: formData.language_code,
        category: formData.category,
        parameter_format: formData.parameter_format,
        components: components,
        body_text: formData.body_text.trim(),
        header_text: showHeader ? formData.header_text.trim() : null,
        footer_text: showFooter ? formData.footer_text.trim() : null,
        parameter_count: parameterCount,
        dealership_id: dealershipId,
        status: 'draft',
      };

      const url = template
        ? `/api/whatsapp/templates/${template.id}`
        : '/api/whatsapp/templates';

      const method = template ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al guardar el template');
      }

      toast({
        title: template ? '✅ Template actualizado' : '✅ Template creado',
        description: template
          ? 'El template ha sido actualizado correctamente'
          : 'El template ha sido creado como borrador',
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error al guardar template:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo guardar el template',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Editar Template' : 'Crear Nuevo Template'}
          </DialogTitle>
          <DialogDescription>
            {template
              ? 'Modifica el template de WhatsApp (solo disponible en estado borrador)'
              : 'Crea un nuevo template de WhatsApp para enviar mensajes pre-aprobados'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulario */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Información Básica</h3>

              <div className="space-y-2">
                <Label htmlFor="name">
                  Nombre del Template *
                  <span className="text-xs text-gray-500 ml-2">
                    (solo letras minúsculas, números y _)
                  </span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value.toLowerCase() })
                  }
                  placeholder="recordatorio_mantenimiento"
                  disabled={saving}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Idioma *</Label>
                  <Select
                    value={formData.language_code}
                    onValueChange={(value) =>
                      setFormData({ ...formData, language_code: value })
                    }
                    disabled={saving}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es_MX">Español (México)</SelectItem>
                      <SelectItem value="es_ES">Español (España)</SelectItem>
                      <SelectItem value="en_US">Inglés (US)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoría *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                    disabled={saving}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTILITY">Utilidad</SelectItem>
                      <SelectItem value="MARKETING">Marketing</SelectItem>
                      <SelectItem value="AUTHENTICATION">Autenticación</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="parameter_format">Formato de Parámetros</Label>
                <Select
                  value={formData.parameter_format}
                  onValueChange={(value) =>
                    setFormData({ ...formData, parameter_format: value })
                  }
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NAMED">
                      Nombrados (ej: {'{{nombre_cliente}}'})
                    </SelectItem>
                    <SelectItem value="POSITIONAL">
                      Posicionales (ej: {'{{1}}, {{2}}'})
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Los parámetros nombrados son más fáciles de entender y mantener
                </p>
              </div>
            </div>

            {/* Componentes del Template */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Componentes del Mensaje</h3>

              {/* Header (Opcional) */}
              <Collapsible open={showHeader} onOpenChange={setShowHeader}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between" type="button">
                    <span>Encabezado (Opcional)</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        showHeader ? 'rotate-180' : ''
                      }`}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <Textarea
                    value={formData.header_text}
                    onChange={(e) =>
                      setFormData({ ...formData, header_text: e.target.value })
                    }
                    placeholder="Título destacado del mensaje"
                    rows={2}
                    disabled={saving}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Texto destacado que aparece al inicio del mensaje
                  </p>
                </CollapsibleContent>
              </Collapsible>

              {/* Body (Requerido) */}
              <div className="space-y-2">
                <Label htmlFor="body_text">Cuerpo del Mensaje *</Label>
                <Textarea
                  id="body_text"
                  value={formData.body_text}
                  onChange={(e) =>
                    setFormData({ ...formData, body_text: e.target.value })
                  }
                  placeholder={
                    formData.parameter_format === 'NAMED'
                      ? 'Hola {{nombre_cliente}}, tu cita es el {{fecha_cita}}...'
                      : 'Hola {{1}}, tu cita es el {{2}}...'
                  }
                  rows={5}
                  disabled={saving}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>
                    Variables detectadas:{' '}
                    {countParameters(formData.body_text, formData.parameter_format)}
                  </span>
                  <span>{formData.body_text.length} / 1024 caracteres</span>
                </div>
              </div>

              {/* Footer (Opcional) */}
              <Collapsible open={showFooter} onOpenChange={setShowFooter}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between" type="button">
                    <span>Pie de Página (Opcional)</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        showFooter ? 'rotate-180' : ''
                      }`}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <Textarea
                    value={formData.footer_text}
                    onChange={(e) =>
                      setFormData({ ...formData, footer_text: e.target.value })
                    }
                    placeholder="Texto adicional en letra pequeña"
                    rows={2}
                    disabled={saving}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Texto en letra pequeña al final del mensaje (sin variables)
                  </p>
                </CollapsibleContent>
              </Collapsible>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">Tip de Parámetros</p>
                  <p className="text-blue-800">
                    {formData.parameter_format === 'NAMED'
                      ? 'Usa {{nombre_variable}} para valores dinámicos. Ejemplo: {{nombre_cliente}}, {{fecha_cita}}'
                      : 'Usa {{1}}, {{2}}, {{3}} para valores dinámicos en orden'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Vista Previa */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Vista Previa</h3>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
              <div className="bg-white rounded-2xl shadow-xl p-4 max-w-sm mx-auto">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                    W
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Tu Taller</div>
                    <div className="text-xs text-gray-500">WhatsApp Business</div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-3 space-y-2">
                  {showHeader && formData.header_text && (
                    <div className="font-semibold text-sm border-b border-green-200 pb-2">
                      {formData.header_text}
                    </div>
                  )}

                  <div className="text-sm whitespace-pre-wrap">
                    {formData.body_text || (
                      <span className="text-gray-400 italic">
                        El cuerpo del mensaje aparecerá aquí...
                      </span>
                    )}
                  </div>

                  {showFooter && formData.footer_text && (
                    <div className="text-xs text-gray-600 pt-2 border-t border-green-200">
                      {formData.footer_text}
                    </div>
                  )}
                </div>

                <div className="text-xs text-gray-400 text-right mt-2">
                  {new Date().toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-900">
                <span className="font-semibold">Nota:</span> El template se guardará como
                borrador. Podrás enviarlo a aprobar desde la lista de templates.
              </p>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : template ? (
              'Actualizar Template'
            ) : (
              'Crear Template'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

