import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function generateStaticParams() {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: servicios } = await supabase
    .from('services')
    .select('id_uuid')
  
  return servicios?.map((servicio) => ({
    id: servicio.id_uuid
  })) || []
}

export default function ServicioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 