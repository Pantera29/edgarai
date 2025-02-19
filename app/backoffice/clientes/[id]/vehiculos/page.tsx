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
    .from('clientes')
    .select('id_uuid')
  
  if (!clientes) return []
  
  return clientes.map((cliente: { id_uuid: string }) => ({
    id: cliente.id_uuid,
  }))
}

export default function ClienteVehiculosPage({ params }: PageProps) {
  return <ClienteVehiculos clienteId={params.id} />
} 