"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getBaseUrl } from "@/lib/utils"
import { verifyToken } from '../../../jwt/token'
import { useEffect, useState } from "react"
import { toast } from "@/components/ui/use-toast"

export default function NuevoClientePage() {
  const router = useRouter()
  
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
        
        // Si el token no es válido, redirigir al login
        if (verifiedDataToken === null) {
          router.push("/login");
        }
        setDataToken(verifiedDataToken || {}); // Actualiza el estado de dataToken
      }
    }
  }, [searchParams, router]); 
  
  const [formData, setFormData] = useState({
    names: "",           // Cambiado de nombre
    email: "",
    phone_number: ""     // Cambiado de telefono
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClientComponentClient()

    try {
      // Validaciones
      if (!formData.names.trim()) {
        toast({
          title: "Error",
          description: "El nombre es requerido",
          variant: "destructive"
        });
        return;
      }

      if (formData.names.length < 2) {
        toast({
          title: "Error",
          description: "El nombre debe tener al menos 2 caracteres",
          variant: "destructive"
        });
        return;
      }

      // Validación de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast({
          title: "Error",
          description: "Por favor ingrese un email válido",
          variant: "destructive"
        });
        return;
      }

      // Validación de teléfono (formato básico: números, espacios, +, -)
      const phoneRegex = /^[+]?[\d\s-]{8,}$/;
      if (!phoneRegex.test(formData.phone_number)) {
        toast({
          title: "Error",
          description: "Por favor ingrese un número de teléfono válido",
          variant: "destructive"
        });
        return;
      }

      // Verificar si hay un dealership_id en el token
      if (!dataToken || !(dataToken as any).dealership_id) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo determinar la agencia. Por favor, inicie sesión nuevamente."
        });
        return;
      }
      
      const dealershipId = (dataToken as any).dealership_id;
      
      const { data, error } = await supabase
        .from('client')
        .insert([{
          ...formData,
          dealership_id: dealershipId
        }])
        .select()

      if (error) throw error

      toast({
        title: "Cliente creado",
        description: "El cliente ha sido registrado exitosamente."
      });

      // Redirigir a la página de clientes con el token (sin refresh=true)
      router.push(`/backoffice/clientes?token=${token}`)
    } catch (error) {
      console.error('Error al crear cliente:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear el cliente. Por favor, intente nuevamente."
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
            onChange={(e) => setFormData({ ...formData, names: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone_number">Teléfono</Label>
          <Input
            id="phone_number"
            value={formData.phone_number}
            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            required
          />
        </div>
        <Button type="submit">Guardar Cliente</Button>
      </form>
    </div>
  )
} 