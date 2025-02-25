"use client"
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface Dealership {
  id: string;
  name: string;
}

export default function RegisterPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("")
  const [dealerships, setDealerships] = useState<Dealership[]>([]);
  const [form, setForm] = useState({
    nombres: "",
    apellidos: "",
    email: "",
    telefono: "",
    password: "",
    confirmPassword: "",
    dealership_id: "",
  });

  
  const [loading, setLoading] = useState(false);

  // Cargar las agencias al montar el componente
  useEffect(() => {
    const loadDealerships = async () => {
      const supabase = createClientComponentClient();
      const { data, error } = await supabase
        .from("dealerships")
        .select("id, name")
        .eq("is_active", true);

      if (error) {
        toast({ variant: "destructive", title: "Error", description: "Error al cargar las agencias" });
      } else if (data) {
        setDealerships(data);
      }
    };

    loadDealerships();
  }, [toast]);

  // Manejar cambios en los inputs
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrorMessage("");
  };

  // Validaciones
  const validarDatos = () => {
    const { nombres, apellidos, email,  password, confirmPassword, dealership_id } = form;

    if (!nombres.trim() || !apellidos.trim() || !email.trim() ||  !password.trim() || !confirmPassword.trim() || !dealership_id) {
      toast({ variant: "destructive", title: "Error", description: "Todos los campos son obligatorios" });
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ variant: "destructive", title: "Error", description: "Correo inválido" });
      return false;
    }

    if (password.length < 6) {
      toast({ variant: "destructive", title: "Error", description: "La contraseña debe tener al menos 6 caracteres" });
      return false;
    }

    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: "Error", description: "Las contraseñas no coinciden" });
      return false;
    }

    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarDatos()) return;
    
    setLoading(true);

    const { nombres, apellidos, email,  password, dealership_id } = form;

    const supabase = createClientComponentClient()

    const { data: operarios, error } = await supabase
      .from("worker_agency")
      .select("*")
      .eq( "email", email );

    if (error ) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo guardar el usuario en la base de datos" });
    } else {
      if(operarios.length>0){
        setErrorMessage("Ya existe un operario registrado con este correo electrónico."); // Establece el mensaje de error
        setLoading(false);
      }
      else {
        const { error: dbError } = await supabase.from("worker_agency").insert([
          { 
            email, 
            password, 
            names : nombres, 
            surnames :apellidos, 
            dealership_id,
            active : true
          }
        ]);
    
        if (dbError) {
          toast({ variant: "destructive", title: "Error", description: "No se pudo guardar el usuario en la base de datos" });
        } else {
          toast({ title: "Registro exitoso", description: "Cuenta creada correctamente" });
          router.push("/backoffice"); 
        }
    
        setLoading(false);
      }
    }

    
  };

  
  return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="bg-white p-6 rounded-lg shadow-md w-96">
          <h2 className="text-2xl font-bold mb-4 text-center">Registrarse</h2>
          {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}
          <form onSubmit={handleRegister} className="space-y-4">
            <Input type="text" name="nombres" placeholder="Nombres" value={form.nombres} onChange={handleChange} required />
            <Input type="text" name="apellidos" placeholder="Apellidos" value={form.apellidos} onChange={handleChange} required />
            <Input type="email" name="email" placeholder="Correo electrónico" value={form.email} onChange={handleChange} required />
            <select 
              name="dealership_id"
              value={form.dealership_id}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="">Selecciona una agencia</option>
              {dealerships.map((dealership) => (
                <option key={dealership.id} value={dealership.id}>
                  {dealership.name}
                </option>
              ))}
            </select>
            <Input type="password" name="password" placeholder="Contraseña" value={form.password} onChange={handleChange} required />
            <Input type="password" name="confirmPassword" placeholder="Confirmar contraseña" value={form.confirmPassword} onChange={handleChange} required />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Registrando..." : "Registrarse"}
            </Button>
          </form>
        </div>
      </div>
  );
}
