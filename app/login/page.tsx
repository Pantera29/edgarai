"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { generateToken } from '../jwt/token';
import { MockDashboard } from "@/components/mock-dashboard";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChangeEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage("");
    setEmail(e.target.value);
  };

  const handleChangePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage("");
    setPassword(e.target.value);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    const { data: workers, error } = await supabase
      .from("worker_agency")
      .select("*")
      .ilike('email', email)
      .eq('password', password)
      .eq('active', true);

    if (error) {
      console.error("Error de inicio de sesión:", error);
      setErrorMessage("Hubo un error en el inicio de sesión.");
    } else {
      if (workers && workers.length > 0) {
        const worker = workers[0];
        const token = generateToken({ 
          id: worker.id, 
          email: worker.email, 
          dealership_id: worker.dealership_id,
          names: worker.names,
          surnames: worker.surnames
        });
        router.push("/backoffice?token=" + token); 
      } else {
        setErrorMessage("No se encontró ningún trabajador con ese correo y contraseña o la cuenta está inactiva.");
      }
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center relative overflow-hidden">
      {/* Capa de fondo con MockDashboard */}
      <div className="absolute inset-0 w-full h-full scale-110 z-0">
        <div className="absolute inset-0 w-full h-full blur-[15px] brightness-[0.7] overflow-hidden">
          <MockDashboard />
        </div>
      </div>
      
      {/* Capa de superposición con gradiente */}
      <div 
        className="absolute inset-0 z-10 bg-gradient-to-tr from-blue-900/80 via-blue-800/50 to-transparent"
        style={{ backdropFilter: 'blur(5px)' }}
      ></div>
      
      {/* Formulario de login con elevación */}
      <Card className="bg-white/95 rounded-xl shadow-2xl z-20 w-96 animate-fade-in-up">
        <CardHeader className="flex flex-col items-center pt-8 pb-4">
          <h2 className="text-2xl font-bold text-center">MuviAI</h2>
          <p className="text-gray-500 text-sm">Panel de Administración</p>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={handleChangeEmail}
                className="rounded-md border-gray-300"
                required
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={handleChangePassword}
                className="rounded-md border-gray-300"
                required
              />
            </div>
            
            {errorMessage && (
              <div className="bg-red-50 text-red-500 text-sm p-3 rounded-md">
                {errorMessage}
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 transition-colors"
              disabled={loading}
            >
              {loading ? "Cargando..." : "Ingresar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
