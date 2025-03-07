'use client';

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface PageProps {
  params: {
    id: string;
  };
}

export default function ServicioPage({ params }: PageProps) {
  const [servicio, setServicio] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function loadServicio() {
      try {
        const supabase = createClientComponentClient()
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('id_uuid', params.id)
          .single()
          
        if (error) {
          console.error('Error cargando servicio:', error)
        } else {
          setServicio(data)
        }
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }
    
    loadServicio()
  }, [params.id])

  if (loading) {
    return <div className="p-4">Cargando servicio...</div>
  }
  
  if (!servicio) {
    return <div className="p-4">Servicio no encontrado</div>
  }

  return (
    <div>
      <h1>Detalles del Servicio {params.id}</h1>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">{servicio?.service_name || 'Servicio no encontrado'}</h2>
        <p className="text-muted-foreground">{servicio?.description || 'Sin descripción'}</p>
        
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Duración</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{servicio?.duration_minutes || 0} minutos</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Precio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${servicio?.price?.toFixed(2) || '0.00'}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 