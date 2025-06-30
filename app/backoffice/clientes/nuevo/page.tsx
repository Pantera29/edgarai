"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getBaseUrl } from "@/lib/utils"
import { verifyToken } from '../../../jwt/token'
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"

export default function NuevoClientePage() {
  const router = useRouter()
  const { toast } = useToast();
  
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(
    null
  );
  const [token, setToken] = useState<string>("");
  const [dataToken, setDataToken] = useState<object>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setSearchParams(params); // Guarda los query params en el estado
    }
  }, []);

  useEffect(() => {
    if (searchParams) {
      const tokenValue = searchParams.get("token"); // Obtiene el token de los query params
      if (tokenValue) {
        setToken(tokenValue); // Usa setToken para actualizar el estado
        const verifiedDataToken = verifyToken(tokenValue); // Verifica el token
        // Mejor validación: redirigir si el token es null, vacío, no es objeto o no tiene dealership_id
        if (
          !verifiedDataToken ||
          typeof verifiedDataToken !== "object" ||
          Object.keys(verifiedDataToken).length === 0 ||
          !(verifiedDataToken as any).dealership_id
        ) {
          router.push("/login");
          return;
        }
        setDataToken(verifiedDataToken || {}); // Actualiza el estado de dataToken
      }
    }
  }, [searchParams, router]); 
  
  const [formData, setFormData] = useState({
    names: "",           // Cambiado de nombre
    email: "",
    phone_number: "",     // Cambiado de telefono
    external_id: ""
  })

  const [formErrors, setFormErrors] = useState({
    email: '',
    phone_number: ''
  });

  // Validaciones adicionales para los campos
  const validateName = (name: string) => {
    if (name.length < 2) {
      return "El nombre debe tener al menos 2 caracteres";
    }
    if (name.length > 100) {
      return "El nombre no puede exceder los 100 caracteres";
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s-]+$/.test(name)) {
      return "El nombre solo puede contener letras, espacios y guiones";
    }
    return null;
  };

  const validateEmail = (email: string) => {
    // Si el email está vacío, es válido (opcional)
    if (!email || email.trim() === '') {
      return null;
    }
    
    if (email.length < 6) {
      return "El email debe tener al menos 6 caracteres";
    }
    if (email.length > 100) {
      return "El email no puede exceder los 100 caracteres";
    }
    if (email.includes(" ")) {
      return "El email no puede contener espacios";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Por favor ingrese un email válido";
    }
    return null;
  };

  const validatePhone = (phone: string) => {
    if (!/^\d{10}$/.test(phone)) {
      return "El teléfono debe tener exactamente 10 dígitos numéricos";
    }
    return null;
  };

  const validateExternalId = (externalId: string) => {
    if (externalId && externalId.length > 50) {
      return "El ID externo no puede exceder los 50 caracteres";
    }
    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
    // Validación en tiempo real para email y teléfono
    if (id === 'email') {
      const error = validateEmail(value);
      setFormErrors((prev) => ({ ...prev, email: error || '' }));
    }
    if (id === 'phone_number') {
      const error = validatePhone(value);
      setFormErrors((prev) => ({ ...prev, phone_number: error || '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('handleSubmit ejecutado');

    // Validaciones avanzadas
    const nameError = validateName(formData.names);
    if (nameError) {
      console.log('Error de nombre:', nameError);
      toast({
        title: "Error",
        description: nameError,
        variant: "destructive"
      });
      return;
    }
    const emailError = validateEmail(formData.email);
    if (emailError) {
      console.log('Error de email:', emailError);
      toast({
        title: "Error",
        description: emailError,
        variant: "destructive"
      });
      return;
    }
    const phoneError = validatePhone(formData.phone_number);
    if (phoneError) {
      console.log('Error de teléfono:', phoneError);
      toast({
        title: "Error",
        description: phoneError,
        variant: "destructive"
      });
      return;
    }
    const externalIdError = validateExternalId(formData.external_id);
    if (externalIdError) {
      console.log('Error de external_id:', externalIdError);
      toast({
        title: "Error",
        description: externalIdError,
        variant: "destructive"
      });
      return;
    }

    try {
      // Verificar si hay un dealership_id en el token
      if (!dataToken || !(dataToken as any).dealership_id) {
        toast({
          variant: "destructive",
          title: "Error de autenticación",
          description: "No se pudo determinar la agencia. Por favor, inicie sesión nuevamente."
        });
        return;
      }
      
      const dealershipId = (dataToken as any).dealership_id;
      
      // Preparar datos del cliente para la API
      const clientData: any = {
        names: formData.names,
        phone_number: formData.phone_number,
        dealership_id: dealershipId,
        external_id: formData.external_id || null
      };

      // Solo incluir email si se proporciona y no está vacío
      if (formData.email && formData.email.trim() !== '') {
        clientData.email = formData.email;
      }
      
      // Llamar a la API en lugar de insertar directamente
      const response = await fetch('/api/customers/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData)
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Error de la API:', result);
        
        // Manejo específico de errores de la API
        let errorMessage = "Error al crear el cliente";
        
        if (response.status === 409) {
          errorMessage = result.message || "Ya existe un cliente con este email o teléfono en esta agencia";
        } else if (response.status === 400) {
          errorMessage = result.message || "Datos inválidos proporcionados";
        } else if (response.status === 500) {
          errorMessage = result.message || "Error interno del servidor";
        }
        
        toast({
          variant: "destructive",
          title: "Error",
          description: errorMessage
        });
        return;
      }

      toast({
        title: "Cliente creado",
        description: "El cliente ha sido registrado exitosamente."
      });

      // Redirigir a la página de clientes con el token
      router.push(`/backoffice/clientes?token=${token}`)
    } catch (error) {
      console.error('Error al crear cliente:', error)
      toast({
        variant: "destructive",
        title: "Error inesperado",
        description: "Ocurrió un error inesperado al crear el cliente. Por favor, intente nuevamente."
      });
    }
  }

  return (
    <div className="space-y-4 p-8">
      <h2 className="text-2xl font-bold">Nuevo Cliente</h2>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div className="space-y-2">
          <Label htmlFor="names">Nombre</Label>
          <Input
            id="names"
            value={formData.names}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email (opcional)</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
          />
          {formErrors.email && (
            <p className="text-sm text-red-500 mt-1">{formErrors.email}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone_number">Teléfono</Label>
          <Input
            id="phone_number"
            value={formData.phone_number}
            onChange={handleInputChange}
            required
          />
          {formErrors.phone_number && (
            <p className="text-sm text-red-500 mt-1">{formErrors.phone_number}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="external_id">External ID (opcional)</Label>
          <Input
            id="external_id"
            value={formData.external_id}
            onChange={handleInputChange}
            placeholder="ID externo del cliente"
          />
        </div>
        <Button type="submit">Guardar Cliente</Button>
      </form>
    </div>
  )
} 