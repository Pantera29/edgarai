export async function resolveWorkshopId(
  dealership_id: string, 
  supabase: any,
  workshop_id?: string | null
): Promise<string> {
  // Si se proporciona workshop_id, validar y retornar
  if (workshop_id) {
    const { data: workshop } = await supabase
      .from('workshops')
      .select('id, dealership_id')
      .eq('id', workshop_id)
      .eq('dealership_id', dealership_id)
      .single();
    
    if (!workshop) {
      throw new Error('Invalid workshop_id for dealership');
    }
    return workshop_id;
  }
  
  // Si no, buscar taller principal
  const { data: mainWorkshop } = await supabase
    .from('workshops')
    .select('id')
    .eq('dealership_id', dealership_id)
    .eq('is_main', true)
    .single();
  
  if (!mainWorkshop) {
    throw new Error('Main workshop not found');
  }
  
  return mainWorkshop.id;
}

export async function getWorkshopConfiguration(
  dealership_id: string, 
  workshop_id: string,
  supabase: any
) {
  const { data: config, error } = await supabase
    .from('dealership_configuration')
    .select('*')
    .eq('dealership_id', dealership_id)
    .eq('workshop_id', workshop_id)
    .maybeSingle();
  
  if (error) throw error;
  
  return config || {
    dealership_id,
    workshop_id,
    shift_duration: 30,
    timezone: 'America/Mexico_City'
  };
} 