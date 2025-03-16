import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"


interface PageProps {
  params: {
    id: string;
  };
}

export async function generateStaticParams() {
  const supabase = createClientComponentClient()
  
  const { data: clientes } = await supabase
    .from('client')
    .select('id')
  
  if (!clientes) return []
  
  return clientes.map((cliente: { id: string }) => ({
    id: cliente.id,
  }))
}

// Componente principal de la página
export default async function ClientePage({ params }: PageProps) {
  const supabase = createClientComponentClient()
  
  const { data: cliente } = await supabase
    .from('client')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!cliente) {
    return <div>Cliente no encontrado</div>
  }

  return (
    <div>
      <h1>Detalles del Cliente</h1>
      <div>
        <h2>{cliente.names}</h2>
        <p>Email: {cliente.email}</p>
        <p>Teléfono: {cliente.phone_number}</p>
      </div>
    </div>
  )
} 