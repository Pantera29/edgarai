import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { ClienteVehiculos } from "@/components/cliente-vehiculos"

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

export default function ClienteVehiculosPage({ params }: PageProps) {
  return <ClienteVehiculos clienteId={params.id} />
} 