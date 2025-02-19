import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface PageProps {
  params: {
    id: string;
  };
}

export async function generateStaticParams() {
  const supabase = createClientComponentClient()
  
  const { data: citas } = await supabase
    .from('citas')
    .select('id_uuid')
  
  if (!citas) return []
  
  return citas.map((cita: { id_uuid: string }) => ({
    id: cita.id_uuid,
  }))
}

export default async function CitaPage({ params }: PageProps) {
  // Tu código actual
  return (
    <div>
      {/* Contenido */}
    </div>
  )
} 