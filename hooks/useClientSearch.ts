import { useState, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useDebouncedCallback } from 'use-debounce';

// Interfaz para clientes extendida
interface ExtendedClient {
  id: string;
  names: string;
  phone_number: string;
  email?: string;
  external_id?: string | null;
  agent_active?: boolean;
  dealership_id?: string;
}

export const useClientSearch = (dealershipId: string) => {
  const [clients, setClients] = useState<ExtendedClient[]>([]);
  const [selectedClients, setSelectedClients] = useState<ExtendedClient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const supabase = createClientComponentClient();

  const searchClients = useDebouncedCallback(async (query: string) => {
    if (!dealershipId) {
      console.warn('No se proporcionó dealershipId para la búsqueda de clientes');
      return;
    }

    setSearchTerm(query);
    
    // Si la consulta está vacía, mostrar solo clientes seleccionados previamente
    if (!query.trim()) {
      setClients(selectedClients);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Buscando clientes con query:', query, 'para dealership:', dealershipId);
      
      // MEJORA: Búsqueda por palabras individuales Y teléfono
      // Dividir la consulta en palabras individuales
      const words = query.trim().split(/\s+/).filter(word => word.length > 0);
      
      let supabaseQuery = supabase
        .from('client')
        .select('id, names, phone_number, email, external_id, agent_active, dealership_id')
        .eq('dealership_id', dealershipId);
      
      if (words.length > 0) {
        // Aplicar filtros para cada palabra del nombre (AND)
        words.forEach(word => {
          supabaseQuery = supabaseQuery.filter('names', 'ilike', `%${word}%`);
        });
        
        // Agregar búsqueda por teléfono completo (OR)
        const phoneQuery = supabase
          .from('client')
          .select('id, names, phone_number, email, external_id, agent_active, dealership_id')
          .eq('dealership_id', dealershipId)
          .ilike('phone_number', `%${query}%`);
        
        // Ejecutar ambas consultas
        const [nameResults, phoneResults] = await Promise.all([
          supabaseQuery.limit(10).order('names'),
          phoneQuery.limit(10).order('names')
        ]);
        
        if (nameResults.error) {
          console.error('❌ Error en búsqueda por nombre:', nameResults.error);
          setError('Error al buscar clientes');
          setClients([]);
          return;
        }
        
        if (phoneResults.error) {
          console.error('❌ Error en búsqueda por teléfono:', phoneResults.error);
          setError('Error al buscar clientes');
          setClients([]);
          return;
        }
        
        // Combinar resultados únicos
        const allResults = [...(nameResults.data || []), ...(phoneResults.data || [])];
        const uniqueResults = allResults.filter((client, index, self) => 
          index === self.findIndex(c => c.id === client.id)
        );
        


        // Obtener los agent_active actualizados de phone_agent_settings
        const phoneNumbers = uniqueResults.map(client => client.phone_number);
        const { data: agentSettingsData } = await supabase
          .from("phone_agent_settings")
          .select("phone_number, agent_active")
          .eq("dealership_id", dealershipId)
          .in("phone_number", phoneNumbers);

        // Crear un mapa para acceso rápido
        const agentSettingsMap = new Map();
        (agentSettingsData || []).forEach(setting => {
          agentSettingsMap.set(setting.phone_number, setting.agent_active);
        });

        // Actualizar agent_active con los valores de phone_agent_settings
        const updatedResults = uniqueResults.map(client => ({
          ...client,
          agent_active: agentSettingsMap.get(client.phone_number) ?? client.agent_active ?? true
        }));

        // Combinar resultados de búsqueda con clientes seleccionados previamente
        const searchResults = updatedResults;
        const combinedResults = [...selectedClients];
        
        // Agregar resultados de búsqueda que no estén ya en selectedClients
        searchResults.forEach(client => {
          if (!combinedResults.find(c => c.id === client.id)) {
            combinedResults.push(client);
          }
        });


        setClients(combinedResults);
        return;
      }
      
      // Si no hay palabras, solo buscar por teléfono
      const { data, error } = await supabaseQuery
        .ilike('phone_number', `%${query}%`)
        .limit(10)
        .order('names');

      if (error) {
        console.error('❌ Error en búsqueda de clientes:', error);
        setError('Error al buscar clientes');
        setClients([]);
        return;
      }

      console.log('✅ Resultados de búsqueda:', data?.length || 0, 'clientes encontrados');
      console.log('📊 Resultados completos:', data);

      // Combinar resultados de búsqueda con clientes seleccionados previamente
      const searchResults = data || [];
      const combinedResults = [...selectedClients];
      
      // Agregar resultados de búsqueda que no estén ya en selectedClients
      searchResults.forEach(client => {
        if (!combinedResults.find(c => c.id === client.id)) {
          combinedResults.push(client);
        }
      });

      console.log('📋 Resultados combinados finales:', combinedResults.length, 'clientes');
      setClients(combinedResults);
    } catch (err) {
      console.error('💥 Error inesperado en búsqueda de clientes:', err);
      setError('Error inesperado al buscar clientes');
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, 300);

  const addSelectedClient = useCallback((client: ExtendedClient) => {
    console.log('➕ Agregando cliente seleccionado:', client);
    setSelectedClients(prev => {
      // Evitar duplicados
      if (prev.find(c => c.id === client.id)) {
        return prev;
      }
      return [...prev, client];
    });
  }, []);

  const getClientById = useCallback((clientId: string): ExtendedClient | undefined => {
    // Buscar primero en clientes seleccionados
    const selected = selectedClients.find(c => c.id === clientId);
    if (selected) return selected;
    
    // Buscar en resultados de búsqueda actual
    return clients.find(c => c.id === clientId);
  }, [selectedClients, clients]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setClients(selectedClients);
    setError(null);
  }, [selectedClients]);

  return {
    clients,
    selectedClients,
    loading,
    error,
    searchTerm,
    searchClients,
    addSelectedClient,
    getClientById,
    clearSearch
  };
}; 