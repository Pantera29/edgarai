import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface PageProps {
  params: {
    id: string;
  };
}

export async function generateStaticParams() {
  const supabase = createClientComponentClient()
  
  const { data: vehiculos } = await supabase
    .from('vehiculos')
    .select('id_uuid')
  
  if (!vehiculos) return []
  
  return vehiculos.map((vehiculo: { id_uuid: string }) => ({
    id: vehiculo.id_uuid,
  }))
}

export default async function VehiculoPage({ params }: PageProps) {
  // Tu código actual
  return (
    <div>
      {/* Contenido */}
    </div>
  )
} 