"use client";
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardDescription, CardContent, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { verifyToken } from '@/app/jwt/token';
import { Bell, Star, Calendar } from 'lucide-react';

export default function RecordatoriosAutomaticosAdminPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [settings, setSettings] = useState({
    confirmation_enabled: true,
    follow_up_enabled: true,
    nps_enabled: true,
    nps_days_after: 1,
    confirmation_days_before: 1,
  });

  // Obtener dealership_id del token de la URL (patrón de configuración)
  const getDealershipId = () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) return null;
    const verifiedData = verifyToken(token);
    if (!verifiedData || typeof verifiedData !== "object" || !verifiedData.dealership_id) return null;
    return verifiedData.dealership_id;
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const supabase = createClientComponentClient();
      const dealership_id = getDealershipId();
      if (!dealership_id) throw new Error('No se encontró dealership_id en el token');
      const { data, error } = await supabase
        .from('dealership_reminder_settings')
        .select('confirmation_enabled, follow_up_enabled, nps_enabled, nps_days_after, confirmation_days_before')
        .eq('dealership_id', dealership_id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data) setSettings(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar la configuración de recordatorios',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = createClientComponentClient();
      const dealership_id = getDealershipId();
      if (!dealership_id) throw new Error('No se encontró dealership_id en el token');
      const { error } = await supabase
        .from('dealership_reminder_settings')
        .upsert({
          dealership_id,
          ...settings,
          updated_at: new Date().toISOString(),
        });
      if (error) throw error;
      toast({
        title: '✅ Configuración guardada',
        description: 'Los cambios se aplicarán en la próxima ejecución automática.',
      });
      setIsEditing(false);
      await fetchSettings();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo guardar la configuración',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Configuración de Recordatorios Automáticos</h1>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} disabled={loading || saving}>
            Modificar configuración
          </Button>
        )}
        {isEditing && (
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={loading || saving}>
              {saving ? 'Guardando...' : 'Guardar Configuración'}
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Cancelar
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6">
        {/* Recordatorio de Confirmación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Confirmación de Cita
            </CardTitle>
            <CardDescription>
              Recordatorio enviado antes de la cita para confirmar asistencia
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="confirmation-enabled">Habilitar recordatorio de confirmación</Label>
                <p className="text-sm text-muted-foreground">
                  Enviar recordatorio antes de la cita
                </p>
              </div>
              <Switch
                id="confirmation-enabled"
                checked={settings.confirmation_enabled}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, confirmation_enabled: checked }))}
                disabled={loading || saving || !isEditing}
              />
            </div>
            
            {settings.confirmation_enabled && (
              <div className="space-y-2">
                <Label htmlFor="confirmation-days">Días antes de la cita</Label>
                <Input
                  id="confirmation-days"
                  type="number"
                  min="1"
                  max="7"
                  value={settings.confirmation_days_before}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    confirmation_days_before: parseInt(e.target.value) || 1 
                  }))}
                  className="w-32"
                  disabled={loading || saving || !isEditing}
                />
                <p className="text-sm text-muted-foreground">
                  El recordatorio se enviará {settings.confirmation_days_before} día{settings.confirmation_days_before > 1 ? 's' : ''} antes de la cita
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recordatorio NPS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Encuesta de Satisfacción (NPS)
            </CardTitle>
            <CardDescription>
              Encuesta enviada después del servicio para medir satisfacción del cliente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="nps-enabled">Habilitar encuesta NPS</Label>
                <p className="text-sm text-muted-foreground">
                  Enviar encuesta de satisfacción post-servicio
                </p>
              </div>
              <Switch
                id="nps-enabled"
                checked={settings.nps_enabled}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, nps_enabled: checked }))}
                disabled={loading || saving || !isEditing}
              />
            </div>
            
            {settings.nps_enabled && (
              <div className="space-y-2">
                <Label htmlFor="nps-days">Días después del servicio</Label>
                <Input
                  id="nps-days"
                  type="number"
                  min="1"
                  max="7"
                  value={settings.nps_days_after}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    nps_days_after: parseInt(e.target.value) || 1 
                  }))}
                  className="w-32"
                  disabled={loading || saving || !isEditing}
                />
                <p className="text-sm text-muted-foreground">
                  La encuesta se enviará {settings.nps_days_after} día{settings.nps_days_after > 1 ? 's' : ''} después de completar el servicio
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recordatorio de Seguimiento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Seguimiento Post-Servicio
            </CardTitle>
            <CardDescription>
              Recordatorio para próximos servicios de mantenimiento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="follow-up-enabled">Habilitar recordatorio de seguimiento</Label>
                <p className="text-sm text-muted-foreground">
                  Enviar recordatorio para próximos servicios
                </p>
              </div>
              <Switch
                id="follow-up-enabled"
                checked={settings.follow_up_enabled}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, follow_up_enabled: checked }))}
                disabled={loading || saving || !isEditing}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 