import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

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