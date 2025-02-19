import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface PageProps {
  params: {
    id: string;
  };
}

export async function generateStaticParams() {
  const supabase = createClientComponentClient()
  
  const { data: clientes } = await supabase
    .from('clientes')
    .select('id_uuid')
  
  if (!clientes) return []
  
  return clientes.map((cliente: { id_uuid: string }) => ({
    id: cliente.id_uuid,
  }))
}

// Componente principal de la página
export default async function ClientePage({ params }: PageProps) {
  const supabase = createClientComponentClient()
  
  const { data: cliente } = await supabase
    .from('clientes')
    .select('*')
    .eq('id_uuid', params.id)
    .single()

  if (!cliente) {
    return <div>Cliente no encontrado</div>
  }

  return (
    <div>
      <h1>Detalles del Cliente</h1>
      {/* Renderiza los detalles del cliente aquí */}
    </div>
  )
} 