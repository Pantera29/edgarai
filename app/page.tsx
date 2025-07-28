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
import Image from "next/image"
import { useToast } from "@/components/ui/use-toast"

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
      asesor: "Mía #1"
    },
    {
      location: "Polanco",
      type: "Cambio de Aceite",
      time: "1m 45s",
      timeAgo: "hace 5 minutos",
      status: "Resuelto",
      score: "5/5",
      asesor: "Mía #2"
    },
    {
      location: "Interlomas",
      type: "Afinación",
      time: "3m 12s",
      timeAgo: "hace 8 minutos",
      status: "En proceso",
      score: "4/5",
      asesor: "Mía #1"
    },
    {
      location: "Santa Fe",
      type: "Revisión de Frenos",
      time: "2m 55s",
      timeAgo: "hace 10 minutos",
      status: "Resuelto",
      score: "5/5",
      asesor: "Mía #3"
    },
    {
      location: "Coyoacán",
      type: "Servicio Básico",
      time: "1m 58s",
      timeAgo: "hace 12 minutos",
      status: "Resuelto",
      score: "4/5",
      asesor: "Mía #2"
    },
    {
      location: "Lomas Verdes",
      type: "Diagnóstico General",
      time: "1m 15s",
      timeAgo: "hace 1 minuto",
      status: "En proceso",
      score: "5/5",
      asesor: "Mía #2"
    },
    {
      location: "Tecamachalco",
      type: "Cambio de Frenos",
      time: "3m 40s",
      timeAgo: "hace 4 minutos",
      status: "Resuelto",
      score: "5/5",
      asesor: "Mía #3"
    },
    {
      location: "Naucalpan",
      type: "Alineación",
      time: "2m 10s",
      timeAgo: "hace 3 minutos",
      status: "En proceso",
      score: "4/5",
      asesor: "Mía #1"
    }
  ];

  const [openFaq, setOpenFaq] = useState('');
  const [casoActivo, setCasoActivo] = useState('agendamiento');
  const [visibleMessages, setVisibleMessages] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  const [telefono, setTelefono] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  // Efecto para animar los mensajes cuando cambia el caso activo
  useEffect(() => {
    setVisibleMessages(0);
    const messageCount = {
      'agendamiento': 6,
      'seguimiento': 5,
      'nps': 5
    }[casoActivo] || 6;
    
    const interval = setInterval(() => {
      setVisibleMessages(prev => {
        if (prev < messageCount) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [casoActivo]);

  useEffect(() => {
    // Hacer scroll al último mensaje
    const messageContainer = document.querySelector('.messages-container');
    if (messageContainer) {
      messageContainer.scrollTop = messageContainer.scrollHeight;
    }
  }, [visibleMessages]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const handleLlamadaDemo = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje("");
    setError("");
    // Validación simple: 10 dígitos
    const tel = telefono.replace(/\D/g, "");
    if (tel.length !== 10) {
      setError("Por favor ingresa un número válido de 10 dígitos.");
      return;
    }
    setIsLoading(true);
    try {
      const bearer = process.env.NEXT_PUBLIC_VAPI_BEARER;
      const response = await fetch("https://api.vapi.ai/call", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${bearer}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          assistantId: "f7be88f4-04c5-4bfc-9737-c200e46e7083",
          assistantOverrides: {
            firstMessageMode: "assistant-waits-for-user"
          },
          customers: [
            {
              number: `+52${tel}`,
              name: "Demo Mía"
            }
          ],
          phoneNumberId: "2a5d74e9-f465-4b6b-bd7a-4c999f63cbbf"
        })
      });
      if (!response.ok) throw new Error("No se pudo iniciar la llamada");
      setMensaje("¡Listo! Mía te llamará en unos segundos.");
      setTelefono("");
    } catch (err) {
      setError("Ocurrió un error al intentar llamar. Intenta de nuevo más tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-[88px]">
      {/* Navbar con logo a la izquierda */}
      <nav className="py-6 px-6 border-b fixed w-full top-0 bg-[#f8fafc] z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Image
              src="/favicon.ico"
              alt="MuviAI Logo"
              width={32}
              height={32}
              className="rounded-sm"
            />
            <div className="text-2xl font-work-sans">
              muvi<span className="font-medium">AI</span>
            </div>
          </div>

          {/* Botón hamburguesa para móvil */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex flex-col gap-1"
          >
            <div className="w-6 h-[2px] bg-gray-800"></div>
            <div className="w-6 h-[2px] bg-gray-800"></div>
            <div className="w-6 h-[2px] bg-gray-800"></div>
          </button>

          {/* Menú móvil */}
          {mobileMenuOpen && (
            <div className="absolute top-full left-0 right-0 bg-[#f8fafc] border-b shadow-lg md:hidden">
              <div className="p-6 space-y-6">
                <button 
                  onClick={() => {
                    scrollToSection('caracteristicas');
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left text-xl font-work-sans"
                >
                  Características
                </button>

                <a 
                  href="/login" 
                  className="block text-xl font-work-sans"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login Agencia
                </a>
                <a 
                  href="https://wa.me/525575131257?text=Estoy%20interesado%20en%20conocer%20a%20Mía"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-primary text-white px-4 py-3 rounded-full text-center text-xl font-work-sans"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Agendar demo
                </a>
              </div>
            </div>
          )}

          {/* Menú de escritorio */}
          <div className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => scrollToSection('caracteristicas')} 
              className="text-gray-600 hover:text-black font-work-sans"
            >
              Características
            </button>

            <a href="/login" className="text-gray-600 hover:text-black font-work-sans">
              Login Agencia
            </a>
            <a 
              href="https://wa.me/525575131257?text=Estoy%20interesado%20en%20conocer%20a%20Mía"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary text-white px-4 py-2 rounded-full hover:bg-primary/90 font-work-sans"
            >
              Agendar demo
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-24 items-start">
            {/* Lado izquierdo - Título, descripción y botón CTA */}
            <div className="text-left flex flex-col">
              <h1 className="text-5xl lg:text-7xl leading-tight font-moranga font-semibold tracking-tight mb-6">
                <span className="text-[#0f172a]">La tranquilidad de saber que</span> <span className="text-primary">Mía</span> <span className="text-[#0f172a]">está cuidando tu negocio</span>
              </h1>
              <p className="text-xl text-[#64748b] mb-12 font-work-sans">
                Mía es una experta en atención al cliente que gestiona citas, WhatsApp y llamadas de tu agencia, con la eficiencia de la IA y la calidez de una asesora humana.
              </p>
              
              {/* Botón CTA alineado debajo del título y subtítulo */}
              <div className="mt-auto">
                <a 
                  href="https://wa.me/525575131257?text=Estoy%20interesado%20en%20conocer%20a%20Mía"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-primary text-white px-8 py-4 rounded-full text-lg hover:bg-primary/90 transition-colors font-work-sans inline-block"
                >
                  Agendar Demo
                </a>
              </div>
            </div>

            {/* Lado derecho - Componente de WhatsApp y toggle */}
            <div className="flex flex-col">
              <div className="bg-[#F0F2F5] rounded-3xl overflow-hidden shadow-2xl transform -translate-y-1">
                {/* Header del chat */}
                <div className="bg-[#075E54] text-white p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <Image
                      src="/favicon.ico"
                      alt="MuviAI Logo"
                      width={24}
                      height={24}
                      className="rounded-sm"
                    />
                  </div>
                  <div>
                    <div className="font-medium font-work-sans">Mía</div>
                    <div className="text-xs opacity-80 font-work-sans">en línea</div>
                  </div>
                </div>

                {/* Contenedor de mensajes */}
                <div 
                  className="p-4 bg-[#E4DDD6] h-[300px] overflow-y-auto space-y-3 messages-container" 
                  style={{ scrollBehavior: 'smooth' }}
                >
                  {casoActivo === 'agendamiento' && (
                    <>
                      {[
                        {
                          user: true,
                          text: "Hola, necesito agendar una cita para servicio",
                          time: "10:30 AM"
                        },
                        {
                          user: false,
                          text: "¡Hola! Con gusto te ayudo a agendar tu cita. ¿Para qué tipo de servicio necesitas la cita?",
                          time: "10:30 AM"
                        },
                        {
                          user: true,
                          text: "Servicio de 10,000 km",
                          time: "10:31 AM"
                        },
                        {
                          user: false,
                          text: "Perfecto. Tengo disponibilidad para mañana a las 9:00 AM o 2:00 PM. ¿Qué horario te funciona mejor?",
                          time: "10:31 AM"
                        },
                        {
                          user: true,
                          text: "Me gustaría a las 9:00 AM",
                          time: "10:32 AM"
                        },
                        {
                          user: false,
                          text: "¡Excelente! Tu cita quedó agendada para mañana a las 9:00 AM. Te enviaré un recordatorio una hora antes. ¿Necesitas algo más?",
                          time: "10:32 AM"
                        }
                      ].slice(Math.max(0, visibleMessages - 4), visibleMessages).map((msg, idx) => (
                        <div key={idx} className={`flex justify-${msg.user ? 'end' : 'start'} animate-slideIn`}>
                          <div className={`${msg.user ? 'bg-[#DCF8C6]' : 'bg-white'} rounded-lg p-3 max-w-[80%] shadow-sm`}>
                            <div className="text-[15px] font-work-sans">{msg.text}</div>
                            <div className="text-[11px] text-gray-500 text-right mt-1 font-work-sans">{msg.time}</div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                  {casoActivo === 'seguimiento' && (
                    <>
                      {visibleMessages >= 1 && (
                        <div className="flex justify-start animate-slideIn">
                          <div className="bg-white rounded-lg p-3 max-w-[80%] shadow-sm relative">
                            <div className="text-[15px] font-work-sans">Hola Juan, tu auto ya está listo. Encontramos algunos detalles adicionales que requieren atención. ¿Te gustaría que te explique?</div>
                            <div className="text-[11px] text-gray-500 text-right mt-1 font-work-sans">10:32 AM</div>
                          </div>
                        </div>
                      )}
                      {visibleMessages >= 2 && (
                        <div className="flex justify-end animate-slideIn">
                          <div className="bg-[#DCF8C6] rounded-lg p-3 max-w-[80%] shadow-sm">
                            <div className="text-[15px] font-work-sans">Sí, por favor dime qué encontraron</div>
                            <div className="text-[11px] text-gray-500 text-right mt-1 font-work-sans">10:32 AM</div>
                          </div>
                        </div>
                      )}
                      {visibleMessages >= 3 && (
                        <div className="flex justify-start animate-slideIn">
                          <div className="bg-white rounded-lg p-3 max-w-[80%] shadow-sm">
                            <div className="text-[15px] font-work-sans">Las balatas están al 20% y recomendamos cambiarlas pronto. También notamos que el líquido de frenos necesita reemplazo. ¿Te gustaría que lo incluyamos en el servicio actual?</div>
                            <div className="text-[11px] text-gray-500 text-right mt-1 font-work-sans">10:33 AM</div>
                          </div>
                        </div>
                      )}
                      {visibleMessages >= 4 && (
                        <div className="flex justify-end animate-slideIn">
                          <div className="bg-[#DCF8C6] rounded-lg p-3 max-w-[80%] shadow-sm">
                            <div className="text-[15px] font-work-sans">Sí, por favor inclúyanlo todo</div>
                            <div className="text-[11px] text-gray-500 text-right mt-1 font-work-sans">10:34 AM</div>
                          </div>
                        </div>
                      )}
                      {visibleMessages >= 5 && (
                        <div className="flex justify-start animate-slideIn">
                          <div className="bg-white rounded-lg p-3 max-w-[80%] shadow-sm">
                            <div className="text-[15px] font-work-sans">Perfecto, procederemos con los trabajos adicionales. Te mantendré informado del progreso.</div>
                            <div className="text-[11px] text-gray-500 text-right mt-1 font-work-sans">10:34 AM</div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {casoActivo === 'nps' && (
                    <>
                      {visibleMessages >= 1 && (
                        <div className="flex justify-start animate-slideIn">
                          <div className="bg-white rounded-lg p-3 max-w-[80%] shadow-sm relative">
                            <div className="text-[15px] font-work-sans">Hola María, ¿qué tal ha funcionado tu auto después del servicio? En escala del 0-10, ¿qué tan probable es que nos recomiendes?</div>
                            <div className="text-[11px] text-gray-500 text-right mt-1 font-work-sans">10:34 AM</div>
                          </div>
                        </div>
                      )}
                      {visibleMessages >= 2 && (
                        <div className="flex justify-end animate-slideIn">
                          <div className="bg-[#DCF8C6] rounded-lg p-3 max-w-[80%] shadow-sm">
                            <div className="text-[15px] font-work-sans">¡Todo excelente! Les doy un 10, el servicio fue muy rápido</div>
                            <div className="text-[11px] text-gray-500 text-right mt-1 font-work-sans">10:34 AM</div>
                          </div>
                        </div>
                      )}
                      {visibleMessages >= 3 && (
                        <div className="flex justify-start animate-slideIn">
                          <div className="bg-white rounded-lg p-3 max-w-[80%] shadow-sm">
                            <div className="text-[15px] font-work-sans">¡Gracias por tu feedback! Te recordamos que tu próximo servicio será en 5,000 km. ¿Te gustaría que te agende un recordatorio?</div>
                            <div className="text-[11px] text-gray-500 text-right mt-1 font-work-sans">10:35 AM</div>
                          </div>
                        </div>
                      )}
                      {visibleMessages >= 4 && (
                        <div className="flex justify-end animate-slideIn">
                          <div className="bg-[#DCF8C6] rounded-lg p-3 max-w-[80%] shadow-sm">
                            <div className="text-[15px] font-work-sans">Sí, por favor</div>
                            <div className="text-[11px] text-gray-500 text-right mt-1 font-work-sans">10:35 AM</div>
                          </div>
                        </div>
                      )}
                      {visibleMessages >= 5 && (
                        <div className="flex justify-start animate-slideIn">
                          <div className="bg-white rounded-lg p-3 max-w-[80%] shadow-sm">
                            <div className="text-[15px] font-work-sans">Listo, te enviaré un recordatorio cuando estés cerca de los 5,000 km. ¡Que tengas un excelente día!</div>
                            <div className="text-[11px] text-gray-500 text-right mt-1 font-work-sans">10:36 AM</div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Footer del chat */}
                <div className="bg-[#F0F2F5] p-4 flex items-center gap-4">
                  <input 
                    type="text" 
                    placeholder="Escribe un mensaje" 
                    className="bg-white rounded-full py-2 px-4 flex-1 text-sm font-work-sans"
                    disabled
                  />
                </div>
              </div>

              {/* Toggle de casos de uso alineado debajo del componente WhatsApp */}
              <div className="flex justify-center mt-6">
                <div className="inline-flex rounded-full border border-gray-200 p-1 bg-white shadow-sm">
                  <button
                    onClick={() => setCasoActivo('agendamiento')}
                    className={`px-6 py-2 rounded-full text-sm transition-colors font-work-sans ${
                      casoActivo === 'agendamiento' ? 'bg-gray-900 text-white' : 'hover:bg-gray-50'
                    }`}
                  >
                    Agendar Cita
                  </button>
                  <button
                    onClick={() => setCasoActivo('seguimiento')}
                    className={`px-6 py-2 rounded-full text-sm transition-colors font-work-sans ${
                      casoActivo === 'seguimiento' ? 'bg-gray-900 text-white' : 'hover:bg-gray-50'
                    }`}
                  >
                    Seguimiento
                  </button>
                  <button
                    onClick={() => setCasoActivo('nps')}
                    className={`px-6 py-2 rounded-full text-sm transition-colors font-work-sans ${
                      casoActivo === 'nps' ? 'bg-gray-900 text-white' : 'hover:bg-gray-50'
                    }`}
                  >
                    NPS
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección Dashboard Preview */}
      <section className="py-24 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl font-moranga font-semibold text-gray-900 mb-6">
              Ve todo desde un solo lugar
            </h2>
            <p className="text-xl text-gray-600 font-work-sans max-w-3xl mx-auto">
              El dashboard de Muvi te da control total sobre Mía y visibilidad completa de tu operación.
            </p>
          </div>
          
          {/* Dashboard Mockup + Features */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Dashboard Mockup */}
            <div className="order-2 lg:order-1">
              {/* Dashboard Container */}
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden hover:shadow-3xl transition-all duration-300">
                {/* Header del Dashboard */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold font-work-sans">Dashboard Muvi</h3>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-blue-100 text-sm font-work-sans">Mía en línea</span>
                    </div>
                  </div>
                </div>
                
                {/* Dashboard Content */}
                <div className="p-6 space-y-6">
                  {/* Métricas Row - Basado en dashboard real */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-700 font-work-sans">Estado de Citas</h4>
                        <span className="text-green-600">📅</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 font-work-sans">Pendientes</span>
                          <span className="text-lg font-bold text-gray-600 font-work-sans">5</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 font-work-sans">Confirmadas</span>
                          <span className="text-lg font-bold text-blue-600 font-work-sans">8</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 font-work-sans">Finalizadas</span>
                          <span className="text-lg font-bold text-green-600 font-work-sans">3</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-700 font-work-sans">Satisfacción</h4>
                        <span className="text-green-600">📊</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-600 font-work-sans">72</div>
                      <div className="text-sm text-gray-600 font-work-sans">NPS</div>
                      <div className="flex items-center mt-1">
                        <span className="text-green-600 text-xs font-work-sans">+45% ↗</span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-700 font-work-sans">Ocupación</h4>
                        <span className="text-blue-600">⚙️</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-600 font-work-sans">67%</div>
                      <div className="text-sm text-gray-600 font-work-sans">del Taller</div>
                      <div className="text-xs text-green-600 font-work-sans">Buena utilización</div>
                    </div>
                  </div>
                  
                  {/* Gráfico de Tendencias */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 font-work-sans">Tendencia de Citas</h4>
                        <p className="text-sm text-gray-600 font-work-sans">Comparación con el mes anterior</p>
                      </div>
                      <div className="text-sm text-gray-600 font-work-sans">+25%</div>
                    </div>
                    
                    {/* Simulación de gráfico simple */}
                    <div className="h-24 flex items-end justify-between gap-1">
                      <div className="bg-blue-300 w-2" style={{height: '60%'}}></div>
                      <div className="bg-blue-400 w-2" style={{height: '40%'}}></div>
                      <div className="bg-blue-500 w-2" style={{height: '80%'}}></div>
                      <div className="bg-blue-400 w-2" style={{height: '55%'}}></div>
                      <div className="bg-blue-600 w-2" style={{height: '90%'}}></div>
                      <div className="bg-blue-500 w-2" style={{height: '70%'}}></div>
                      <div className="bg-blue-400 w-2" style={{height: '65%'}}></div>
                      <div className="bg-blue-600 w-2" style={{height: '95%'}}></div>
                      <div className="bg-blue-500 w-2" style={{height: '75%'}}></div>
                      <div className="bg-blue-400 w-2" style={{height: '50%'}}></div>
                      <div className="bg-blue-500 w-2" style={{height: '85%'}}></div>
                      <div className="bg-blue-600 w-2" style={{height: '100%'}}></div>
                    </div>
                    
                    <div className="flex justify-between mt-2 text-xs text-gray-500 font-work-sans">
                      <span>Semana 1</span>
                      <span>Semana 2</span>
                      <span>Semana 3</span>
                      <span>Semana 4</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Features List */}
            <div className="order-1 lg:order-2 space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📊</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 font-work-sans">
                    Métricas en tiempo real
                  </h3>
                  <p className="text-gray-600 font-work-sans">
                    Ve cuántas citas se han agendado, conversaciones activas y nivel de satisfacción de tus clientes.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">💬</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 font-work-sans">
                    Control total de Mía
                  </h3>
                  <p className="text-gray-600 font-work-sans">
                    Pausa, activa o ajusta cómo responde Mía. Tú tienes el control completo de tu asistente virtual.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📅</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 font-work-sans">
                    Historial completo
                  </h3>
                  <p className="text-gray-600 font-work-sans">
                    Revisa todas las conversaciones, citas agendadas y el rendimiento de Mía desde un solo lugar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Sección de llamada demo Mía */}
      {/*
      <section className="py-16 bg-blue-50">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">¿Quieres ver a Mía en acción?</h2>
          <p className="mb-6 text-gray-600">Ingresa tu número de teléfono y recibe una llamada demo de Mía.</p>
          <form className="flex flex-col sm:flex-row gap-4 justify-center items-center" onSubmit={handleLlamadaDemo}>
            <input
              type="tel"
              placeholder="Ej: 5512345678"
              value={telefono}
              onChange={e => setTelefono(e.target.value)}
              className="rounded-md border px-4 py-2 flex-1 bg-white text-black"
              required
              maxLength={10}
              pattern="[0-9]{10}"
            />
            <button
              type="submit"
              className="bg-primary text-white px-6 py-2 rounded-md font-semibold"
              disabled={isLoading}
            >
              {isLoading ? 'Llamando...' : 'Recibir llamada'}
            </button>
          </form>
          {mensaje && <div className="mt-4 text-green-600">{mensaje}</div>}
          {error && <div className="mt-4 text-red-600">{error}</div>}
        </div>
      </section>
      */}

      {/* Sección de FAQs */}
      <section className="py-20 bg-[#f8fafc]">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl font-moranga font-bold text-center mb-12">Preguntas Frecuentes</h2>
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button 
                onClick={() => setOpenFaq(openFaq === 'faq1' ? '' : 'faq1')}
                className="w-full flex items-center justify-between p-6 text-left bg-[#f8fafc] hover:bg-gray-100"
              >
                <h3 className="text-xl font-bold font-work-sans">¿Cómo funciona Mía?</h3>
                <svg 
                  className={`w-6 h-6 transform transition-transform ${openFaq === 'faq1' ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openFaq === 'faq1' && (
                <div className="p-6 pt-0 text-gray-600 animate-slideDown font-work-sans">
                  Mía utiliza inteligencia artificial avanzada para gestionar llamadas, agendar citas y dar seguimiento a tus clientes de manera automática, 24/7.
                </div>
              )}
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button 
                onClick={() => setOpenFaq(openFaq === 'faq2' ? '' : 'faq2')}
                className="w-full flex items-center justify-between p-6 text-left bg-[#f8fafc] hover:bg-gray-100"
              >
                <h3 className="text-xl font-bold font-work-sans">¿Cuánto tiempo toma la implementación?</h3>
                <svg 
                  className={`w-6 h-6 transform transition-transform ${openFaq === 'faq2' ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openFaq === 'faq2' && (
                <div className="p-6 pt-0 text-gray-600 animate-slideDown font-work-sans">
                  La implementación es rápida y sencilla, en menos de 24 horas Mía estará funcionando en tu concesionario.
                </div>
              )}
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button 
                onClick={() => setOpenFaq(openFaq === 'faq3' ? '' : 'faq3')}
                className="w-full flex items-center justify-between p-6 text-left bg-[#f8fafc] hover:bg-gray-100"
              >
                <h3 className="text-xl font-bold font-work-sans">¿Se integra con mi sistema actual?</h3>
                <svg 
                  className={`w-6 h-6 transform transition-transform ${openFaq === 'faq3' ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openFaq === 'faq3' && (
                <div className="p-6 pt-0 text-gray-600 animate-slideDown font-work-sans">
                  Sí, Mía se integra con los sistemas más populares de gestión de concesionarios y CRMs del mercado.
                </div>
              )}
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button 
                onClick={() => setOpenFaq(openFaq === 'faq4' ? '' : 'faq4')}
                className="w-full flex items-center justify-between p-6 text-left bg-[#f8fafc] hover:bg-gray-100"
              >
                <h3 className="text-xl font-bold font-work-sans">¿Qué soporte ofrecen?</h3>
                <svg 
                  className={`w-6 h-6 transform transition-transform ${openFaq === 'faq4' ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openFaq === 'faq4' && (
                <div className="p-6 pt-0 text-gray-600 animate-slideDown font-work-sans">
                  Ofrecemos soporte técnico 24/7 y un equipo dedicado para asegurar que Mía funcione perfectamente en tu negocio.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer className="bg-[#f8fafc] text-gray-700 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-center items-center">
            <p className="text-gray-600 font-work-sans">
              © 2025 MuviAI. Todos los derechos reservados.
            </p>
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

