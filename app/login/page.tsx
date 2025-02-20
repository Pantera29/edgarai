"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); // Estado para el mensaje de error

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(""); // Resetea el mensaje de error antes de intentar el login

    const { data: operarios, error } = await supabase
      .from("operario")
      .select("*")
      .match({ email: email, password: password });

    if (error) {
      setErrorMessage("Hubo un error en el inicio de sesión.");
    } else {
      if (operarios.length > 0) {
        router.push("/backoffice"); 
      } else {
        setErrorMessage("No se encontró ningún operario con ese correo y contraseña."); // Establece el mensaje de error
      }
    }

    setLoading(false);
  };

  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    setErrorMessage(""); // Limpia el mensaje de error cuando hay cambios en los campos
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-4 text-center">Iniciar sesión</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={handleInputChange(setEmail)} // Limpia el error al cambiar el valor
            required
          />
          <Input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={handleInputChange(setPassword)} // Limpia el error al cambiar el valor
            required
          />
          {/* Muestra el mensaje de error si existe */}
          {errorMessage && (
            <p className="text-red-500 text-sm">{errorMessage}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Cargando..." : "Ingresar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
