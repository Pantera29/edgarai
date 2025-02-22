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

  const [openFaq, setOpenFaq] = useState('');
  const [casoActivo, setCasoActivo] = useState('agendamiento');
  const [visibleMessages, setVisibleMessages] = useState<number>(0);

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

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar con logo a la izquierda */}
      <nav className="py-6 px-6 border-b">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image
              src="/favicon.ico"
              alt="EdgarAI Logo"
              width={32}
              height={32}
              className="rounded-sm"
            />
            <div className="text-2xl font-light">
              edgar<span className="font-medium">AI</span>
            </div>
          </div>
          
          <div className="flex items-center gap-8">
            <button 
              onClick={() => scrollToSection('caracteristicas')} 
              className="text-gray-600 hover:text-black"
            >
              Características
            </button>
            <button 
              onClick={() => scrollToSection('casos-de-uso')} 
              className="text-gray-600 hover:text-black"
            >
              Casos de Uso
            </button>
            <a href="/login" className="text-gray-600 hover:text-black">
              Login Agencia
            </a>
            <a 
              href="https://wa.me/525575131257?text=Estoy%20interesado%20en%20conocer%20a%20Edgar"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary text-white px-4 py-2 rounded-full hover:bg-primary/90"
            >
              Agendar demo
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section simplificado */}
      <section className="py-32 bg-[#FDF8F6]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-[3.5rem] leading-tight font-outfit font-semibold mb-6">
            <span className="text-primary">Edgar</span>, el asistente virtual que
            <br />
            automatiza tu área de servicio
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          Edgar es un experto en atención al cliente que gestiona citas, WhatsApp y llamadas de tu agencia, con la eficiencia de la IA y la calidez de un asesor humano.
          </p>
          <div className="flex justify-center">
            <a 
              href="https://wa.me/525575131257?text=Estoy%20interesado%20en%20conocer%20a%20Edgar"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary text-white px-8 py-4 rounded-full text-lg hover:bg-primary/90 transition-colors"
            >
              Agendar Demo
            </a>
          </div>
        </div>
      </section>

      {/* Sección de características */}
      <section id="caracteristicas" className="py-20">
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

      {/* Sección de Casos de Uso */}
      <section id="casos-de-uso" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-outfit text-center mb-4">
            Casos de Uso
          </h2>
          <p className="text-xl text-gray-600 text-center mb-16">
            Descubre cómo Edgar ayuda a tu concesionario en cada etapa
          </p>

          {/* Selector de casos de uso */}
          <div className="flex justify-center my-12">
            <div className="inline-flex rounded-full border border-gray-200 p-1 bg-white">
              <button
                onClick={() => setCasoActivo('agendamiento')}
                className={`px-6 py-2 rounded-full text-sm transition-colors ${
                  casoActivo === 'agendamiento' ? 'bg-gray-900 text-white' : 'hover:bg-gray-50'
                }`}
              >
                Agendar Cita
              </button>
              <button
                onClick={() => setCasoActivo('seguimiento')}
                className={`px-6 py-2 rounded-full text-sm transition-colors ${
                  casoActivo === 'seguimiento' ? 'bg-gray-900 text-white' : 'hover:bg-gray-50'
                }`}
              >
                Seguimiento
              </button>
              <button
                onClick={() => setCasoActivo('nps')}
                className={`px-6 py-2 rounded-full text-sm transition-colors ${
                  casoActivo === 'nps' ? 'bg-gray-900 text-white' : 'hover:bg-gray-50'
                }`}
              >
                NPS y Postventa
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Descripción del caso de uso */}
            <div>
              {casoActivo === 'agendamiento' && (
                <div className="space-y-4">
                  <h3 className="text-2xl font-medium">Agendamiento Automático</h3>
                  <p className="text-gray-600">
                    Edgar gestiona el proceso completo de agendamiento de citas, desde la solicitud inicial hasta la confirmación. 
                    Utilizando IA, puede:
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Entender el tipo de servicio requerido</li>
                    <li>• Verificar disponibilidad en tiempo real</li>
                    <li>• Sugerir horarios óptimos</li>
                    <li>• Enviar recordatorios automáticos</li>
                    <li>• Gestionar cambios y cancelaciones</li>
                  </ul>
                </div>
              )}
              {casoActivo === 'seguimiento' && (
                <div className="space-y-4">
                  <h3 className="text-2xl font-medium">Seguimiento Proactivo</h3>
                  <p className="text-gray-600">
                    Mantén a tus clientes informados durante todo el proceso de servicio. 
                    Edgar puede:
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Notificar el estado del servicio</li>
                    <li>• Comunicar hallazgos adicionales</li>
                    <li>• Solicitar autorizaciones para reparaciones</li>
                    <li>• Coordinar la entrega del vehículo</li>
                    <li>• Enviar cotizaciones y facturas</li>
                  </ul>
                </div>
              )}
              {casoActivo === 'nps' && (
                <div className="space-y-4">
                  <h3 className="text-2xl font-medium">Satisfacción y Fidelización</h3>
                  <p className="text-gray-600">
                    Mejora la experiencia post-servicio y mantén a tus clientes regresando. 
                    Edgar se encarga de:
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Encuestas de satisfacción automatizadas</li>
                    <li>• Seguimiento de quejas y sugerencias</li>
                    <li>• Recordatorios de próximo servicio</li>
                    <li>• Programas de fidelización</li>
                    <li>• Recopilación y análisis de feedback</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Chat simulado */}
            <div className="bg-[#F0F2F5] rounded-2xl overflow-hidden shadow-lg">
              {/* Header del chat */}
              <div className="bg-[#075E54] text-white p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <Image
                    src="/favicon.ico"
                    alt="EdgarAI Logo"
                    width={24}
                    height={24}
                    className="rounded-sm"
                  />
                </div>
                <div>
                  <div className="font-medium">Edgar</div>
                  <div className="text-xs opacity-80">en línea</div>
                </div>
              </div>

              {/* Contenedor de mensajes */}
              <div 
                className="p-4 bg-[#E4DDD6] h-[400px] overflow-y-auto space-y-3 messages-container" 
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
                          <div className="text-[15px]">{msg.text}</div>
                          <div className="text-[11px] text-gray-500 text-right mt-1">{msg.time}</div>
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
                          <div className="text-[15px]">Hola Juan, tu auto ya está listo. Encontramos algunos detalles adicionales que requieren atención. ¿Te gustaría que te explique?</div>
                          <div className="text-[11px] text-gray-500 text-right mt-1">10:32 AM</div>
                        </div>
                      </div>
                    )}
                    {visibleMessages >= 2 && (
                      <div className="flex justify-end animate-slideIn">
                        <div className="bg-[#DCF8C6] rounded-lg p-3 max-w-[80%] shadow-sm">
                          <div className="text-[15px]">Sí, por favor dime qué encontraron</div>
                          <div className="text-[11px] text-gray-500 text-right mt-1">10:32 AM</div>
                        </div>
                      </div>
                    )}
                    {visibleMessages >= 3 && (
                      <div className="flex justify-start animate-slideIn">
                        <div className="bg-white rounded-lg p-3 max-w-[80%] shadow-sm">
                          <div className="text-[15px]">Las balatas están al 20% y recomendamos cambiarlas pronto. También notamos que el líquido de frenos necesita reemplazo. ¿Te gustaría que lo incluyamos en el servicio actual?</div>
                          <div className="text-[11px] text-gray-500 text-right mt-1">10:33 AM</div>
                        </div>
                      </div>
                    )}
                    {visibleMessages >= 4 && (
                      <div className="flex justify-end animate-slideIn">
                        <div className="bg-[#DCF8C6] rounded-lg p-3 max-w-[80%] shadow-sm">
                          <div className="text-[15px]">Sí, por favor inclúyanlo todo</div>
                          <div className="text-[11px] text-gray-500 text-right mt-1">10:34 AM</div>
                        </div>
                      </div>
                    )}
                    {visibleMessages >= 5 && (
                      <div className="flex justify-start animate-slideIn">
                        <div className="bg-white rounded-lg p-3 max-w-[80%] shadow-sm">
                          <div className="text-[15px]">Perfecto, procederemos con los trabajos adicionales. Te mantendré informado del progreso.</div>
                          <div className="text-[11px] text-gray-500 text-right mt-1">10:34 AM</div>
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
                          <div className="text-[15px]">Hola María, ¿qué tal ha funcionado tu auto después del servicio? En escala del 0-10, ¿qué tan probable es que nos recomiendes?</div>
                          <div className="text-[11px] text-gray-500 text-right mt-1">10:34 AM</div>
                        </div>
                      </div>
                    )}
                    {visibleMessages >= 2 && (
                      <div className="flex justify-end animate-slideIn">
                        <div className="bg-[#DCF8C6] rounded-lg p-3 max-w-[80%] shadow-sm">
                          <div className="text-[15px]">¡Todo excelente! Les doy un 10, el servicio fue muy rápido</div>
                          <div className="text-[11px] text-gray-500 text-right mt-1">10:34 AM</div>
                        </div>
                      </div>
                    )}
                    {visibleMessages >= 3 && (
                      <div className="flex justify-start animate-slideIn">
                        <div className="bg-white rounded-lg p-3 max-w-[80%] shadow-sm">
                          <div className="text-[15px]">¡Gracias por tu feedback! Te recordamos que tu próximo servicio será en 5,000 km. ¿Te gustaría que te agende un recordatorio?</div>
                          <div className="text-[11px] text-gray-500 text-right mt-1">10:35 AM</div>
                        </div>
                      </div>
                    )}
                    {visibleMessages >= 4 && (
                      <div className="flex justify-end animate-slideIn">
                        <div className="bg-[#DCF8C6] rounded-lg p-3 max-w-[80%] shadow-sm">
                          <div className="text-[15px]">Sí, por favor</div>
                          <div className="text-[11px] text-gray-500 text-right mt-1">10:35 AM</div>
                        </div>
                      </div>
                    )}
                    {visibleMessages >= 5 && (
                      <div className="flex justify-start animate-slideIn">
                        <div className="bg-white rounded-lg p-3 max-w-[80%] shadow-sm">
                          <div className="text-[15px]">Listo, te enviaré un recordatorio cuando estés cerca de los 5,000 km. ¡Que tengas un excelente día!</div>
                          <div className="text-[11px] text-gray-500 text-right mt-1">10:36 AM</div>
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
                  className="bg-white rounded-full py-2 px-4 flex-1 text-sm"
                  disabled
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de FAQs */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl font-outfit text-center mb-12">Preguntas Frecuentes</h2>
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button 
                onClick={() => setOpenFaq(openFaq === 'faq1' ? '' : 'faq1')}
                className="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-gray-50"
              >
                <h3 className="text-xl font-medium">¿Cómo funciona Edgar?</h3>
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
                <div className="p-6 pt-0 text-gray-600 animate-slideDown">
                  Edgar utiliza inteligencia artificial avanzada para gestionar llamadas, agendar citas y dar seguimiento a tus clientes de manera automática, 24/7.
                </div>
              )}
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button 
                onClick={() => setOpenFaq(openFaq === 'faq2' ? '' : 'faq2')}
                className="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-gray-50"
              >
                <h3 className="text-xl font-medium">¿Cuánto tiempo toma la implementación?</h3>
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
                <div className="p-6 pt-0 text-gray-600 animate-slideDown">
                  La implementación es rápida y sencilla, en menos de 24 horas Edgar estará funcionando en tu concesionario.
                </div>
              )}
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button 
                onClick={() => setOpenFaq(openFaq === 'faq3' ? '' : 'faq3')}
                className="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-gray-50"
              >
                <h3 className="text-xl font-medium">¿Se integra con mi sistema actual?</h3>
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
                <div className="p-6 pt-0 text-gray-600 animate-slideDown">
                  Sí, Edgar se integra con los sistemas más populares de gestión de concesionarios y CRMs del mercado.
                </div>
              )}
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button 
                onClick={() => setOpenFaq(openFaq === 'faq4' ? '' : 'faq4')}
                className="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-gray-50"
              >
                <h3 className="text-xl font-medium">¿Qué soporte ofrecen?</h3>
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
                <div className="p-6 pt-0 text-gray-600 animate-slideDown">
                  Ofrecemos soporte técnico 24/7 y un equipo dedicado para asegurar que Edgar funcione perfectamente en tu negocio.
                </div>
              )}
            </div>
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

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center">
            <div className="text-xl font-light text-white">
              edgar<span className="font-medium">AI</span>
            </div>
            <p className="text-sm text-gray-400">
              © 2025 EdgarAI. Todos los derechos reservados.
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

