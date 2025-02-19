"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Badge } from "@/components/ui/badge"
import { TooltipProvider } from '@radix-ui/react-tooltip'
import Link from "next/link"
import { MessageSquare, ArrowRight, Phone, Clock } from 'lucide-react'

interface Servicio {
  nombre: string;
}

interface Cliente {
  nombre: string;
}

interface CitaSupabase {
  id_uuid: string;
  fecha_hora: string;
  estado: string;
  clientes: Cliente;
  servicios: {
    nombre: string;
  };
}

interface DashboardData {
  totalClientes: number
  totalVehiculos: number
  citasPendientes: number
  citasHoy: number
  serviciosPorEstado: {
    estado: string
    cantidad: number
  }[]
  ingresosMensuales: {
    mes: string
    ingresos: number
  }[]
  proximasCitas: {
    id_uuid: string
    fecha_hora: string
    estado: string
    cliente: {
      nombre: string
    }
    servicios: Servicio[]
  }[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

export default function LandingPage() {
  // Base de llamadas más grande
  const allCalls = [
    {
      location: "Satélite",
      type: "Servicio Mayor",
      time: "2m 26s",
      timeAgo: "hace 2 minutos",
      status: "Resuelto",
      score: "4/5",
      asesor: "Edgar #1"
    },
    {
      location: "Polanco",
      type: "Cambio de Aceite",
      time: "1m 45s",
      timeAgo: "hace 5 minutos",
      status: "Resuelto",
      score: "5/5",
      asesor: "Edgar #2"
    },
    {
      location: "Interlomas",
      type: "Afinación",
      time: "3m 12s",
      timeAgo: "hace 8 minutos",
      status: "En proceso",
      score: "4/5",
      asesor: "Edgar #1"
    },
    {
      location: "Santa Fe",
      type: "Revisión de Frenos",
      time: "2m 55s",
      timeAgo: "hace 10 minutos",
      status: "Resuelto",
      score: "5/5",
      asesor: "Edgar #3"
    },
    {
      location: "Coyoacán",
      type: "Servicio Básico",
      time: "1m 58s",
      timeAgo: "hace 12 minutos",
      status: "Resuelto",
      score: "4/5",
      asesor: "Edgar #2"
    },
    {
      location: "Lomas Verdes",
      type: "Diagnóstico General",
      time: "1m 15s",
      timeAgo: "hace 1 minuto",
      status: "En proceso",
      score: "5/5",
      asesor: "Edgar #2"
    },
    {
      location: "Tecamachalco",
      type: "Cambio de Frenos",
      time: "3m 40s",
      timeAgo: "hace 4 minutos",
      status: "Resuelto",
      score: "5/5",
      asesor: "Edgar #3"
    },
    {
      location: "Naucalpan",
      type: "Alineación",
      time: "2m 10s",
      timeAgo: "hace 3 minutos",
      status: "En proceso",
      score: "4/5",
      asesor: "Edgar #1"
    }
  ];

  // Estado para las llamadas activas
  const [activeCalls, setActiveCalls] = useState(allCalls.slice(0, 5));
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const updateCalls = () => {
      setIsExiting(true);

      setTimeout(() => {
        // Tomamos las primeras 4 llamadas y las movemos una posición hacia abajo
        const newCalls = [...activeCalls.slice(0, 4)];
        
        // Elegimos una nueva llamada aleatoria para poner al principio
        const randomCall = allCalls[Math.floor(Math.random() * allCalls.length)];
        const newCall = {
          ...randomCall,
          time: `${Math.floor(Math.random() * 3) + 1}m ${Math.floor(Math.random() * 59)}s`,
          timeAgo: `hace ${Math.floor(Math.random() * 5) + 1} minutos`
        };

        // La insertamos al principio
        newCalls.unshift(newCall);

        setActiveCalls(newCalls);
        setIsExiting(false);
      }, 800);
    };

    const interval = setInterval(updateCalls, 2000);
    return () => clearInterval(interval);
  }, [activeCalls]);

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar simplificado */}
      <nav className="py-6 px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="text-xl font-light">edgar<span className="font-medium">AI</span></div>
          <div className="flex gap-8 items-center">
            <a href="/backoffice" className="text-gray-600 hover:text-black">Login</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-6xl mb-6 font-medium">
            Conoce a <span className="text-primary">Edgar</span>, tu nuevo asistente de 
            <span className="text-primary"> servicio con IA</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Edgar gestiona tus citas, llamadas y seguimientos automáticamente, mejorando la satisfacción de tus clientes y maximizando tus ingresos
          </p>
          <div className="flex justify-center gap-4">
            <button className="bg-black text-white px-6 py-3 rounded flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Hablar con Edgar
            </button>
            <button className="text-black px-6 py-3 rounded border border-gray-200 flex items-center gap-2">
              Agendar Demo
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Sección de Estadísticas */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-medium">¿Sabías que?</h2>
            <p className="text-2xl text-gray-800 mt-4">
              Las agencias están <span className="text-primary font-medium">perdiendo oportunidades</span> por no optimizar su gestión de servicio
            </p>
            <p className="text-lg text-gray-600 mt-2">Principales desafíos en la gestión de llamadas</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl text-center shadow-sm">
              <div className="text-4xl font-light text-primary mb-4">40%</div>
              <p className="text-gray-600">de clientes están insatisfechos con la respuesta a sus llamadas</p>
            </div>
            <div className="bg-white p-8 rounded-xl text-center shadow-sm">
              <div className="text-4xl font-light text-primary mb-4">33%</div>
              <p className="text-gray-600">de llamadas entrantes no son contestadas</p>
            </div>
            <div className="bg-white p-8 rounded-xl text-center shadow-sm">
              <div className="text-4xl font-light text-primary mb-4">80%</div>
              <p className="text-gray-600">de leads no reciben seguimiento activo</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Llamadas en Vivo */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl font-medium mb-6">Llamadas en Tiempo Real</h2>
          <p className="text-gray-600 mb-12">Más de 1 millón de minutos gestionados</p>
          
          <div className="space-y-4">
            {activeCalls.map((call, index) => (
              <div 
                key={`${call.location}-${call.time}`}
                className={`call-item bg-white p-4 rounded-lg border border-gray-100 flex items-center justify-between hover:shadow-md ${
                  isExiting && index === 4 ? 'exiting' : ''
                }`}
                style={{
                  animationDelay: `${index * 200}ms`
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Phone className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">{call.asesor}</div>
                    <div>
                      <span className="text-gray-600">Alguien de</span>{" "}
                      <span className="font-medium">{call.location}</span>
                      <span className="text-gray-600"> solicitó</span>{" "}
                      <span className="font-medium">{call.type}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400">{call.time}</span>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm ${
                    call.status === "Resuelto" 
                      ? "bg-green-100 text-green-600" 
                      : "bg-blue-100 text-blue-600"
                  }`}>
                    {call.score}
                  </div>
                  <div className="text-gray-400 text-sm">{call.timeAgo}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-medium mb-6">¿Listo para conocer a Edgar?</h2>
          <p className="text-xl text-gray-600 mb-8">Implementación en menos de 24 horas</p>
          {/* ... botones CTA ... */}
        </div>
      </section>
    </div>
  );
}

// Agregar estos estilos en tu globals.css
/*
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
*/

