"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";



export default function RegisterPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("")
  const [form, setForm] = useState({
    nombres: "",
    apellidos: "",
    email: "",
    telefono: "",
    password: "",
    confirmPassword: "",
  });

  
  const [loading, setLoading] = useState(false);

  // Manejar cambios en los inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrorMessage("")
  };

  // Validaciones
  const validarDatos = () => {
    const { nombres, apellidos, email, telefono, password, confirmPassword } = form;

    if (!nombres.trim() || !apellidos.trim() || !email.trim() || !telefono.trim() || !password.trim() || !confirmPassword.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Todos los campos son obligatorios" });
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ variant: "destructive", title: "Error", description: "Correo inválido" });
      return false;
    }

    if (!/^\d+$/.test(telefono)) {
      toast({ variant: "destructive", title: "Error", description: "El número de teléfono debe contener solo números" });
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

    const { nombres, apellidos, email, telefono, password } = form;

    const supabase = createClientComponentClient()

    const { data: operarios, error } = await supabase
      .from("operario")
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
        const { error: dbError } = await supabase.from("operario").insert([
          { email, password, nombres, apellidos, telefono }
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
            <Input type="text" name="telefono" placeholder="Número de teléfono" value={form.telefono} onChange={handleChange} required />
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
