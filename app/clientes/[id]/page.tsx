export async function generateStaticParams() {
  // Obtén todos los IDs de clientes que quieras pre-renderizar
  const clientes = await fetch('...')
  const data = await clientes.json()
  
  return data.map((cliente) => ({
    id: cliente.id,
  }))
} 