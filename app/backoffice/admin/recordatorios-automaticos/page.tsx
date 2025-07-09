"use client";
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardDescription, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { verifyToken } from '@/app/jwt/token';

export default function RecordatoriosAutomaticosAdminPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [settings, setSettings] = useState({
    confirmation_enabled: true,
    follow_up_enabled: true,
    nps_enabled: true,
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
        .select('confirmation_enabled, follow_up_enabled, nps_enabled')
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
        <h1 className="text-3xl font-bold">Recordatorios automáticos</h1>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} disabled={loading || saving}>
            Modificar configuración
          </Button>
        )}
        {isEditing && (
          <Button onClick={handleSave} disabled={loading || saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardDescription>
            Activa o desactiva los tipos de recordatorio que tu taller enviará automáticamente a los clientes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">Confirmación de cita</span>
              <p className="text-sm text-muted-foreground">Envia un recordatorio 1 día antes de la cita.</p>
            </div>
            <Switch
              checked={settings.confirmation_enabled}
              onCheckedChange={checked => setSettings(s => ({ ...s, confirmation_enabled: checked }))}
              disabled={loading || saving || !isEditing}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">Seguimiento post-servicio</span>
              <p className="text-sm text-muted-foreground">Envia un recordatorio X meses después del servicio.</p>
            </div>
            <Switch
              checked={settings.follow_up_enabled}
              onCheckedChange={checked => setSettings(s => ({ ...s, follow_up_enabled: checked }))}
              disabled={loading || saving || !isEditing}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">Encuesta de satisfacción (NPS)</span>
              <p className="text-sm text-muted-foreground">Envia una encuesta 1 día después de completar el servicio.</p>
            </div>
            <Switch
              checked={settings.nps_enabled}
              onCheckedChange={checked => setSettings(s => ({ ...s, nps_enabled: checked }))}
              disabled={loading || saving || !isEditing}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 