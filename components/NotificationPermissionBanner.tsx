"use client";

import { useState, useEffect } from 'react';
import { Bell, BellOff, X, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  requestNotificationPermission,
  getNotificationConfig,
  saveNotificationConfig,
  type NotificationConfig
} from '@/utils/notification-helpers';

export function NotificationPermissionBanner() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showBanner, setShowBanner] = useState(false);
  const [config, setConfig] = useState<NotificationConfig>({ enabled: true, sound: true });
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      setShowBanner(Notification.permission === 'default');
      setConfig(getNotificationConfig());
    }
  }, []);

  const handleRequestPermission = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    setShowBanner(false);
    
    if (result === 'granted') {
      // Mostrar notificación de prueba
      new Notification('¡Notificaciones activadas!', {
        body: 'Recibirás alertas cuando lleguen mensajes de clientes con agente AI desactivado',
        icon: '/favicon.ico',
      });
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
  };

  const toggleNotifications = () => {
    const newConfig = { ...config, enabled: !config.enabled };
    setConfig(newConfig);
    saveNotificationConfig(newConfig);
  };

  const toggleSound = () => {
    const newConfig = { ...config, sound: !config.sound };
    setConfig(newConfig);
    saveNotificationConfig(newConfig);
  };

  // Banner para solicitar permisos (solo si aún no se han solicitado)
  if (showBanner && permission === 'default') {
    return (
      <Card className="mb-4 p-4 border-blue-200 bg-blue-50">
        <div className="flex items-start gap-3">
          <Bell className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-1">
              Activar notificaciones de mensajes urgentes
            </h3>
            <p className="text-sm text-blue-800 mb-3">
              Recibe alertas cuando lleguen mensajes de clientes con agente AI desactivado, 
              incluso cuando el navegador esté minimizado.
            </p>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleRequestPermission}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Activar notificaciones
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleDismiss}
              >
                Ahora no
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    );
  }

  // Controles de configuración (cuando ya tiene permisos)
  if (permission === 'granted') {
    return (
      <Card className="mb-4 p-3 border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {config.enabled ? (
              <Bell className="h-4 w-4 text-green-600" />
            ) : (
              <BellOff className="h-4 w-4 text-gray-400" />
            )}
            <span className="text-sm font-medium">Notificaciones urgentes</span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Toggle de sonido */}
            <div className="flex items-center gap-2">
              {config.sound ? (
                <Volume2 className="h-4 w-4 text-gray-600" />
              ) : (
                <VolumeX className="h-4 w-4 text-gray-400" />
              )}
              <Switch
                checked={config.sound}
                onCheckedChange={toggleSound}
                disabled={!config.enabled}
              />
            </div>
            
            {/* Toggle principal */}
            <Switch
              checked={config.enabled}
              onCheckedChange={toggleNotifications}
            />
          </div>
        </div>
        
        {config.enabled && (
          <p className="text-xs text-muted-foreground mt-2">
            Solo para clientes con agente AI desactivado
          </p>
        )}
      </Card>
    );
  }

  // Si los permisos fueron denegados, mostrar mensaje informativo
  if (permission === 'denied') {
    return (
      <Card className="mb-4 p-3 border-orange-200 bg-orange-50">
        <div className="flex items-start gap-2">
          <BellOff className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-orange-800">
              Las notificaciones están bloqueadas. Para activarlas, permite las notificaciones 
              en la configuración de tu navegador.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return null;
}
