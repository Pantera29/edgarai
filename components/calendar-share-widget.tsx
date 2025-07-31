'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Share2, 
  Copy, 
  Check, 
  RefreshCw, 
  X, 
  Calendar, 
  Users, 
  Clock,
  Eye,
  Globe
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CalendarShareWidgetProps {
  dealershipId: string;
}

interface TokenInfo {
  token: string;
  expires_in_days: number;
  dealership_id: string;
  created_at?: string;
  last_accessed_at?: string;
  access_count?: number;
}

export default function CalendarShareWidget({ dealershipId }: CalendarShareWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState(30);
  const { toast } = useToast();

  const calendarUrl = tokenInfo?.token 
    ? `${window.location.origin}/calendar/${dealershipId}?token=${tokenInfo.token}`
    : '';

  // Generar nuevo token
  const generateToken = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Generando token de calendario...');
      
      // Obtener el token JWT de la URL
      const urlParams = new URLSearchParams(window.location.search);
      const jwtToken = urlParams.get('token');
      
      if (!jwtToken) {
        throw new Error('Token de autenticación no encontrado');
      }
      
      const response = await fetch('/api/calendar/token', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify({ expires_in_days: expiresInDays })
      });

      if (!response.ok) {
        throw new Error('Error generando token');
      }

      const data = await response.json();
      setTokenInfo(data);
      
      toast({
        title: "✅ Token generado",
        description: "El calendario ya está listo para compartir",
      });
      
      console.log('✅ Token generado exitosamente');
    } catch (error) {
      console.log('❌ Error generando token:', error);
      toast({
        title: "❌ Error",
        description: "No se pudo generar el token. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Revocar token
  const revokeToken = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Revocando token...');
      
      // Obtener el token JWT de la URL
      const urlParams = new URLSearchParams(window.location.search);
      const jwtToken = urlParams.get('token');
      
      if (!jwtToken) {
        throw new Error('Token de autenticación no encontrado');
      }
      
      const response = await fetch('/api/calendar/token', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${jwtToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Error revocando token');
      }

      setTokenInfo(null);
      
      toast({
        title: "✅ Acceso revocado",
        description: "El calendario ya no es accesible públicamente",
      });
      
      console.log('✅ Token revocado exitosamente');
    } catch (error) {
      console.log('❌ Error revocando token:', error);
      toast({
        title: "❌ Error",
        description: "No se pudo revocar el acceso. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Copiar URL al portapapeles
  const copyUrl = async () => {
    if (!calendarUrl) return;
    
    try {
      await navigator.clipboard.writeText(calendarUrl);
      setCopied(true);
      
      toast({
        title: "📋 URL copiada",
        description: "El enlace del calendario se copió al portapapeles",
      });
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.log('❌ Error copiando URL:', error);
      toast({
        title: "❌ Error",
        description: "No se pudo copiar la URL",
        variant: "destructive",
      });
    }
  };



  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Share2 className="h-4 w-4" />
          {tokenInfo ? 'Calendario Compartido' : 'Compartir Calendario'}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Compartir Calendario
          </DialogTitle>
          <DialogDescription>
            Genera un enlace público para que el equipo del taller pueda ver el calendario de citas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!tokenInfo ? (
            // Estado: Sin token generado
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Configuración</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="expires-days" className="text-sm">
                      Expira en días
                    </Label>
                    <Input
                      id="expires-days"
                      type="number"
                      value={expiresInDays}
                      onChange={(e) => setExpiresInDays(Number(e.target.value))}
                      className="w-20"
                      min="1"
                      max="365"
                    />
                  </div>
                </CardContent>
              </Card>

              <Button 
                onClick={generateToken} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 mr-2" />
                    Generar Enlace Público
                  </>
                )}
              </Button>
            </div>
          ) : (
            // Estado: Con token generado
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <Globe className="h-3 w-3 mr-1" />
                      Público
                    </Badge>
                    Enlace Activo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">URL del Calendario</Label>
                    <div className="flex gap-2">
                      <Input
                        value={calendarUrl}
                        readOnly
                        className="text-xs"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={copyUrl}
                        disabled={copied}
                      >
                        {copied ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>


                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={generateToken}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Renovando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Renovar
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  onClick={revokeToken}
                  disabled={isLoading}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Revocar
                </Button>
              </div>
            </div>
          )}

          {/* Información adicional */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Eye className="h-3 w-3" />
                  <span>Solo lectura - No pueden modificar citas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3" />
                  <span>Acceso desde cualquier dispositivo</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  <span>Expira automáticamente</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
} 