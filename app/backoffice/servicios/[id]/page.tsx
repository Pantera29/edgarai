import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { Database } from "@/lib/db"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface PageProps {
  params: {
    id: string;
  };
}

export async function generateStaticParams() {
  const supabase = createServerComponentClient<Database>({ cookies })
  
  const { data: servicios } = await supabase
    .from('services')
    .select('id_uuid')
  
  return servicios?.map((servicio) => ({
    id: servicio.id_uuid
  })) || []
}

export default function ServicioPage({ params }: PageProps) {
  // Obtener datos del servicio
  const { data: servicio } = await createClientComponentClient<Database>()
    .from('services')
    .select('*')
    .eq('id_uuid', params.id)
    .single()

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