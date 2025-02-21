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
        // Elegimos una nueva llamada aleatoria
        const randomCall = allCalls[Math.floor(Math.random() * allCalls.length)];
        const newCall = {
          ...randomCall,
          time: `${Math.floor(Math.random() * 3) + 1}m ${Math.floor(Math.random() * 59)}s`,
          timeAgo: `hace ${Math.floor(Math.random() * 5) + 1} minutos`
        };

        // Creamos un nuevo array con la nueva llamada al principio y las 4 primeras llamadas actuales
        const newCalls = [newCall, ...activeCalls.slice(0, 4)];

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
            <a href="/login" className="text-gray-600 hover:text-black">Login</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-[3.5rem] leading-tight font-outfit font-semibold mb-6">
              Conoce a <span className="text-primary">Edgar</span>, tu nuevo asistente de servicio con IA
            </h1>
            <p className="text-xl text-gray-600 mb-12 leading-relaxed">
            Edgar gestiona tus citas, llamadas y seguimientos automáticamente, mejorando la satisfacción de tus clientes y maximizando tus ingresos
            </p>
            <div className="flex gap-4">
              <button className="bg-black text-white px-6 py-3 rounded-full flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Hablar con Edgar
              </button>
              <a 
                href="https://wa.me/525575131257?text=Estoy%20interesado%20en%20conocer%20a%20Edgar"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black px-6 py-3 rounded-full border border-gray-200 flex items-center gap-2 hover:bg-gray-50"
              >
                Agendar Demo
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square bg-gray-100 rounded-full overflow-hidden">
              {/* Aquí podrías poner una imagen o ilustración representativa */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3/4 h-3/4 bg-blue-50 rounded-full flex items-center justify-center">
                  <svg 
                    className="w-1/2 h-1/2 text-primary" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nueva sección de características */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-outfit text-center mb-4">
            IA diseñada específicamente para concesionarios automotrices
          </h2>
          <p className="text-xl text-gray-600 text-center mb-16">
            Edgar fue entrenado junto a concesionarios líderes y desarrollado por expertos en IA
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="feature-card p-6 rounded-xl bg-white border border-gray-100">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M7 7h10M7 12h10M7 17h10" />
                </svg>
              </div>
              <h3 className="text-xl font-medium mb-2">Totalmente Personalizable</h3>
              <p className="text-gray-600">
                Crea asistentes con personalidades, acentos y comportamientos que tus clientes esperan.
              </p>
            </div>

            <div className="feature-card p-6 rounded-xl bg-white border border-gray-100">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85.83 6.72 2.24" />
                  <path d="M21 3v4h-4" />
                </svg>
              </div>
              <h3 className="text-xl font-medium mb-2">Auto-Aprendizaje</h3>
              <p className="text-gray-600">
                Edgar aprende con el tiempo las mejores formas de manejar diferentes situaciones basado en tu retroalimentación.
              </p>
            </div>

            <div className="feature-card p-6 rounded-xl bg-white border border-gray-100">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <h3 className="text-xl font-medium mb-2">Alta Visibilidad</h3>
              <p className="text-gray-600">
                Visualiza las interacciones de la IA a todos los niveles, desde una llamada individual hasta todo el concesionario.
              </p>
            </div>

            <div className="feature-card p-6 rounded-xl bg-white border border-gray-100">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="m5 8 6 6M9.5 8h5v5" />
                  <path d="M19 11a7 7 0 1 1-7-7" />
                </svg>
              </div>
              <h3 className="text-xl font-medium mb-2">Multilingüe</h3>
              <p className="text-gray-600">
                Utiliza más de 30 idiomas, incluso simultáneamente, para entender a cualquier cliente.
              </p>
            </div>

            <div className="feature-card p-6 rounded-xl bg-white border border-gray-100">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M19 10c0 3.976-7 11-7 11s-7-7.024-7-11 3.134-7 7-7 7 3.024 7 7Z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium mb-2">Voz Natural</h3>
              <p className="text-gray-600">
                Ayuda a tus clientes a sentirse cómodos con voces y patrones de habla naturales y humanos.
              </p>
            </div>

            <div className="feature-card p-6 rounded-xl bg-white border border-gray-100">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M8 18h8M8 6h8M12 2v20" />
                </svg>
              </div>
              <h3 className="text-xl font-medium mb-2">Totalmente Integrado</h3>
              <p className="text-gray-600">
                Edgar se conecta con los sistemas más populares de gestión y agendamiento desde el primer día.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Estadísticas */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-outfit">¿Sabías que?</h2>
            <p className="text-2xl text-gray-800 mt-4">
              Las agencias están <span className="text-primary font-medium">perdiendo oportunidades</span> por no optimizar su gestión de servicio
            </p>
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
          <h2 className="text-4xl font-outfit mb-6">Edgar en Acción</h2>
          
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
          <h2 className="text-4xl font-outfit mb-6">¿Listo para conocer a Edgar?</h2>
          <p className="text-xl text-gray-600 mb-8">Implementación en menos de 24 horas</p>
          <div className="flex justify-center gap-4">
            <button className="bg-black text-white px-6 py-3 rounded flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Hablar con Edgar
            </button>
            <a 
              href="https://wa.me/525575131257?text=Estoy%20interesado%20en%20conocer%20a%20Edgar"
              target="_blank"
              rel="noopener noreferrer"
              className="text-black px-6 py-3 rounded border border-gray-200 flex items-center gap-2 hover:bg-gray-50"
            >
              Agendar Demo
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Sección de FAQs */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl font-outfit text-center mb-12">Preguntas Frecuentes</h2>
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-medium mb-2">¿Cómo funciona Edgar?</h3>
              <p className="text-gray-600">
                Edgar utiliza inteligencia artificial avanzada para gestionar llamadas, agendar citas y dar seguimiento a tus clientes de manera automática, 24/7.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-medium mb-2">¿Cuánto tiempo toma la implementación?</h3>
              <p className="text-gray-600">
                La implementación es rápida y sencilla, en menos de 24 horas Edgar estará funcionando en tu concesionario.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-medium mb-2">¿Se integra con mi sistema actual?</h3>
              <p className="text-gray-600">
                Sí, Edgar se integra con los sistemas más populares de gestión de concesionarios y CRMs del mercado.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-medium mb-2">¿Qué soporte ofrecen?</h3>
              <p className="text-gray-600">
                Ofrecemos soporte técnico 24/7 y un equipo dedicado para asegurar que Edgar funcione perfectamente en tu negocio.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-xl font-light text-white mb-4">
                edgar<span className="font-medium">AI</span>
              </div>
              <p className="text-sm text-gray-400">
                Transformando la atención al cliente en la industria automotriz con IA
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-white mb-4">Producto</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Características</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Precios</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Demo</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-white mb-4">Empresa</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Sobre Nosotros</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contacto</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-white mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacidad</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Términos</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-sm text-gray-400">
            <p>© 2025 EdgarAI. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
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

