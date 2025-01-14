import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface PageProps {
  params: {
    id: string;
  };
}

export async function generateStaticParams() {
  const supabase = createClientComponentClient()
  
  const { data: servicios } = await supabase
    .from('servicios')
    .select('id_uuid')
  
  if (!servicios) return []
  
  return servicios.map((servicio: { id_uuid: string }) => ({
    id: servicio.id_uuid,
  }))
}

export default function ServicioPage({ params }: PageProps) {
  return (
    <div>
      {/* Aquí va el contenido de la página de servicio */}
      <h1>Detalles del Servicio {params.id}</h1>
    </div>
  )
} 