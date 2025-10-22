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
      // Obtener los workshops válidos para este dealership
      const { data: validWorkshops } = await supabase
        .from('workshops')
        .select('id, name, is_main, is_active')
        .eq('dealership_id', dealership_id)
        .eq('is_active', true)
        .order('is_main', { ascending: false });
      
      const workshopsList = validWorkshops?.map(w => 
        `${w.id} (${w.name}${w.is_main ? ' - Main' : ''})`
      ).join(', ') || 'None available';
      
      console.error('❌ Invalid workshop_id:', {
        provided_workshop_id: workshop_id,
        dealership_id: dealership_id,
        valid_workshops: validWorkshops
      });
      
      throw new Error(
        `Invalid workshop_id for dealership. The provided workshop_id "${workshop_id}" does not belong to dealership "${dealership_id}" or does not exist. ` +
        `Please verify the workshop_id is correct and belongs to this dealership. ` +
        `Available workshops for this dealership: ${workshopsList}. ` +
        `You can also omit the workshop_id parameter to use the main workshop automatically.`
      );
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
    console.error('❌ Main workshop not found:', { dealership_id });
    throw new Error(
      `Main workshop not found for dealership "${dealership_id}". ` +
      `Please ensure this dealership has a main workshop configured, or provide a specific workshop_id parameter.`
    );
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