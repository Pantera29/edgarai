import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface PageProps {
  params: {
    id: string;
  };
}

export async function generateStaticParams() {
  const supabase = createClientComponentClient()
  
  const { data: vehiculos } = await supabase
    .from('vehicles')
    .select('id')
  
  if (!vehiculos) return []
  
  return vehiculos.map((vehiculo: { id: string }) => ({
    id: vehiculo.id,
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