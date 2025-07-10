import { useState, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useDebouncedCallback } from 'use-debounce';

// Interfaz para clientes extendida
interface ExtendedClient {
  id: string;
  names: string;
  phone_number: string;
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
      
      // MEJORA: Búsqueda por nombre Y teléfono
      const { data, error } = await supabase
        .from('client')
        .select('id, names, phone_number, dealership_id')
        .or(`names.ilike.%${query}%,phone_number.ilike.%${query}%`)
        .eq('dealership_id', dealershipId)
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