import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface Cliente {
  id_uuid: string;
  nombre: string;
  // ... otros campos que necesites
}

export async function generateStaticParams() {
  const supabase = createClientComponentClient()
  
  // Obtener todos los clientes de Supabase
  const { data: clientes } = await supabase
    .from('clientes')
    .select('id_uuid')
  
  // Si no hay clientes, retornar un array vacío
  if (!clientes) return []
  
  // Mapear los IDs para las rutas estáticas
  return clientes.map((cliente: Cliente) => ({
    id: cliente.id_uuid,
  }))
} 