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
import { MessageSquare, ArrowRight, Phone, Clock, ChevronLeft, Video, MoreVertical, Paperclip, Camera, Mic, Smile } from 'lucide-react'
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

  // Loop automático entre casos de uso
  useEffect(() => {
    const order: Array<'agendamiento' | 'seguimiento' | 'nps'> = ['agendamiento', 'nps', 'seguimiento'];
    const currentIndex = order.indexOf(casoActivo as 'agendamiento' | 'seguimiento' | 'nps');
    const timeout = setTimeout(() => {
      const next = order[(currentIndex + 1) % order.length];
      setCasoActivo(next);
    }, 9000);
    return () => clearTimeout(timeout);
  }, [casoActivo]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (!element) return;
    const headerOffset = 64; // altura de la navbar fija (más reducida)
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - headerOffset;
    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
  };

  // Eventos para el marquee del hero
  type Tone = 'success' | 'info' | 'warning' | 'danger';
  const eventsRow1: { text: string; tone: Tone }[] = [
    { text: 'Cita reagendada por el cliente', tone: 'warning' },
    { text: 'NPS respondido 8/10 - Neutro', tone: 'info' },
    { text: 'Problema escalado a humano', tone: 'danger' },
    { text: 'Recordatorio de mañana programado', tone: 'info' },
    { text: 'NPS respondido 6/10 - Detractor', tone: 'danger' },
  ];
  const eventsRow2: { text: string; tone: Tone }[] = [
    { text: 'Cita agendada para jueves 13:00', tone: 'success' },
    { text: 'Recordatorio confirmado', tone: 'success' },
    { text: 'NPS respondido 7/10 - Neutro', tone: 'info' },
    { text: 'Problema escalado a humano', tone: 'danger' },
    { text: 'Cita cancelada y reprogramada', tone: 'warning' },
  ];
  const eventsRow3: { text: string; tone: Tone }[] = [
    { text: 'Recordatorio de kilómetro creado', tone: 'info' },
    { text: 'Cita agendada para viernes 14:00', tone: 'success' },
    { text: 'NPS respondido 10/10 - Promotor', tone: 'success' },
    { text: 'Recordatorio fallido, reintentando', tone: 'warning' },
    { text: 'Escalado resuelto por humano', tone: 'success' },
  ];

  const toneStyles: Record<Tone, { dot: string; border: string }> = {
    success: { dot: 'bg-emerald-600', border: 'border-emerald-300/80' },
    info: { dot: 'bg-blue-600', border: 'border-blue-300/80' },
    warning: { dot: 'bg-amber-500', border: 'border-amber-400' },
    danger: { dot: 'bg-rose-600', border: 'border-rose-400' },
  };

  // Panel lateral de flujos (sin badge visual, solo título y descripción)
  const flowsMeta: Array<{ key: 'agendamiento' | 'nps' | 'seguimiento'; number: string; title: string; description: string }> = [
    {
      key: 'agendamiento',
      number: '1',
      title: 'Agenda de citas',
      description: 'Mía agenda citas por WhatsApp en segundos y confirma disponibilidad.'
    },
    {
      key: 'nps',
      number: '2',
      title: 'Encuesta de Satisfacción',
      description: 'Mía envía y recopila NPS automáticamente para medir satisfacción.'
    },
    {
      key: 'seguimiento',
      number: '3',
      title: 'Recordatorios automáticos',
      description: 'Mía envía recordatorios de servicio y seguimiento sin intervención.'
    }
  ];


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
    <div className="min-h-screen bg-white pt-[64px] overflow-x-hidden">
      {/* Navbar con diseño tipo Flai */}
      <nav className="py-4 px-4 md:px-6 fixed w-full top-0 bg-white z-50">
        <div className="max-w-6xl mx-auto relative flex items-center">
          {/* Logo a la izquierda */}
          <div className="flex items-center cursor-pointer" onClick={() => scrollToSection('hero')} role="button" aria-label="Ir al inicio">
            <div className="text-2xl font-bold text-black">
              Muvi
            </div>
          </div>

          {/* Navegación centrada respecto a toda la pantalla - solo en desktop */}
          <div className="hidden md:flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2">
            <button
              onClick={() => scrollToSection('mia-en-accion')}
              className="text-gray-600 hover:text-black font-work-sans transition-colors"
            >
              Qué hacemos
            </button>
            <button
              onClick={() => scrollToSection('caracteristicas')}
              className="text-gray-600 hover:text-black font-work-sans transition-colors"
            >
              Cómo funciona
            </button>
            <button
              onClick={() => scrollToSection('faqs')}
              className="text-gray-600 hover:text-black font-work-sans transition-colors"
            >
              FAQs
            </button>
          </div>

          {/* CTA y Login a la derecha - solo en desktop */}
          <div className="hidden md:flex items-center gap-4 ml-auto">
            <a 
              href="https://wa.me/525575131257?text=Hola%2C%20quiero%20agendar%20una%20demo%20de%20MuviAI"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors font-work-sans"
            >
              Agendar demo
            </a>
            <a href="/login" className="text-black font-work-sans hover:text-gray-700 transition-colors">
              Login Agencia
            </a>
          </div>

          {/* Botón hamburguesa para móvil */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex flex-col gap-1 p-2 rounded-lg hover:bg-gray-100 transition-colors ml-auto"
            aria-label="Abrir menú de navegación"
          >
            <div className={`w-6 h-[2px] bg-gray-800 transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-1' : ''}`}></div>
            <div className={`w-6 h-[2px] bg-gray-800 transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`}></div>
            <div className={`w-6 h-[2px] bg-gray-800 transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-1' : ''}`}></div>
          </button>

          {/* Overlay para cerrar menú móvil */}
          {mobileMenuOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          {/* Menú móvil */}
          {mobileMenuOpen && (
            <div className="absolute top-full left-0 right-0 bg-white border-b shadow-lg md:hidden z-50 animate-slideDown">
              <div className="p-6 space-y-4">
                <button 
                  onClick={() => {
                    scrollToSection('mia-en-accion');
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left text-lg font-work-sans text-gray-600 hover:text-black py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Qué hacemos
                </button>
                <button 
                  onClick={() => {
                    scrollToSection('caracteristicas');
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left text-lg font-work-sans text-gray-600 hover:text-black py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cómo funciona
                </button>
                <button 
                  onClick={() => {
                    scrollToSection('faqs');
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left text-lg font-work-sans text-gray-600 hover:text-black py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  FAQs
                </button>
                <a 
                  href="https://wa.me/525575131257?text=Hola%2C%20quiero%20agendar%20una%20demo%20de%20MuviAI"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-primary text-white px-4 py-3 rounded-lg text-center text-lg font-work-sans hover:bg-primary/90 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Agendar demo
                </a>
                <a 
                  href="/login"
                  className="block text-center text-lg font-work-sans text-gray-600 hover:text-black py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login Agencia
                </a>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="relative pt-16 md:pt-16 lg:pt-20 pb-6 md:pb-8 bg-white min-h-[calc(100vh-64px)]">
        {/* Refuerzos de gradiente locales (suaves) */}
        {/* gradientes removidos */}
        <div className="relative max-w-5xl mx-auto px-6 md:px-6">
          <div className="flex flex-col items-center text-center">
            {/* Título, descripción y botón CTA centrados */}
                      <div className="flex flex-col items-center space-y-4">
            {/* Eyebrow text */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-medium border border-blue-200">
              🚗 Para concesionarios y talleres
            </div>
            
            {/* Título principal */}
            <h1 className="text-4xl md:text-5xl lg:text-7xl leading-tight font-moranga font-semibold tracking-tight mb-6 mx-8 md:mx-0">
              <span className="text-[#0f172a]"><span className="text-blue-600">Recupera tu tiempo</span> con IA que agenda, recuerda y mide satisfacción por ti</span>
            </h1>
            
            {/* Subtítulo */}
            <p className="text-lg md:text-xl text-[#64748b] mb-8 md:mb-10 font-work-sans max-w-4xl font-normal">
              Citas, recordatorios, NPS y métricas en una plataforma integrada
            </p>
              
              {/* Espacio entre subtítulo y CTA - un renglón */}
              <div className="h-8 md:h-10"></div>
              
              {/* Botón CTA centrado */}
              <div className="flex flex-col items-center">
                <a 
                  href="https://wa.me/525575131257?text=Hola%2C%20quiero%20agendar%20una%20demo%20de%20MuviAI"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-primary text-white px-8 py-4 rounded-full text-lg hover:bg-primary/90 transition-colors font-work-sans inline-block"
                >
                  Agendar demo
                </a>
              </div>

              {/* Espacio adicional - dos renglones */}
              <div className="h-12 md:h-15"></div>

              {/* Marquee de eventos (contenedor anclado al viewport para evitar desbordes) */}
              <div className="relative left-1/2 -translate-x-1/2 w-screen max-w-screen overflow-hidden space-y-3 opacity-70 pointer-events-none px-12 md:px-6">
                {/* Fila 1 - izquierda */}
                <div className="relative overflow-hidden w-full">
                  <div className="marquee-left inline-flex gap-3 whitespace-nowrap will-change-transform">
                    {[...eventsRow1, ...eventsRow1, ...eventsRow1].map((item, idx) => (
                      <span
                        key={`r1-${idx}`}
                        className={`inline-flex items-center gap-2 rounded-full border ${toneStyles[item.tone].border} bg-white/70 px-3 py-1 text-sm text-gray-800 shadow-sm backdrop-blur`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${toneStyles[item.tone].dot}`} />
                        {item.text}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Fila 2 - derecha */}
                <div className="relative overflow-hidden w-full">
                  <div className="marquee-right inline-flex gap-3 whitespace-nowrap will-change-transform">
                    {[...eventsRow2, ...eventsRow2, ...eventsRow2].map((item, idx) => (
                      <span
                        key={`r2-${idx}`}
                        className={`inline-flex items-center gap-2 rounded-full border ${toneStyles[item.tone].border} bg-white/70 px-3 py-1 text-sm text-gray-800 shadow-sm backdrop-blur`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${toneStyles[item.tone].dot}`} />
                        {item.text}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Fila 3 - izquierda */}
                <div className="relative overflow-hidden w-full">
                  <div className="marquee-left inline-flex gap-3 whitespace-nowrap will-change-transform">
                    {[...eventsRow3, ...eventsRow3, ...eventsRow3].map((item, idx) => (
                      <span
                        key={`r3-${idx}`}
                        className={`inline-flex items-center gap-2 rounded-full border ${toneStyles[item.tone].border} bg-white/70 px-3 py-1 text-sm text-gray-800 shadow-sm backdrop-blur`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${toneStyles[item.tone].dot}`} />
                        {item.text}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Fin hero, el teléfono se mueve a su propia sección */}
          </div>
        </div>
      </section>

      {/* Sección Teléfono WhatsApp */}
      <section className="relative py-10 mt-24 md:mt-28 bg-transparent" id="mia-en-accion">
        {/* gradientes removidos */}
        <div className="relative max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-moranga font-semibold text-gray-900 text-center mb-8 md:mb-10">Mía en acción</h2>
          <div className="flex justify-center">
            <div className="relative w-fit flex flex-col items-center">
              {/* Wrapper con ancho real escalado para layout correcto */}
              <div className="relative w-[280px] md:w-[277px] h-[570px] shrink-0">
                <div className="w-[360px] md:w-[360px] scale-[0.78] md:scale-[0.77] origin-top-left">
                  {/* Bisel del iPhone */}
                  <div className="relative h-[740px] rounded-[44px] bg-black shadow-2xl">
                    {/* Borde/bisel */}
                    <div className="absolute inset-[6px] rounded-[38px] bg-black" />
                    {/* Isla dinámica */}
                    <div className="absolute left-1/2 top-0 z-20 h-7 w-40 -translate-x-1/2 translate-y-2 rounded-b-2xl bg-black" />
                    {/* Pantalla */}
                    <div className="absolute inset-[10px] overflow-hidden rounded-[34px] bg-white flex flex-col">
                      {/* Header de WhatsApp */}
                      <div className="bg-[#075E54] text-white">
                        {/* Barra de estado */}
                        <div className="flex items-center justify-between px-4 pt-2 text-[11px]">
                          <span className="font-medium">9:41</span>
                          <div className="flex items-center gap-1 text-white/90">
                            {/* Señal */}
                            <svg width="18" height="12" viewBox="0 0 18 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                              <rect x="1" y="8" width="2" height="3" rx="0.5" fill="currentColor"/>
                              <rect x="5" y="6" width="2" height="5" rx="0.5" fill="currentColor"/>
                              <rect x="9" y="4" width="2" height="7" rx="0.5" fill="currentColor"/>
                              <rect x="13" y="2" width="2" height="9" rx="0.5" fill="currentColor"/>
                            </svg>
                            {/* Wi‑Fi */}
                            <svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                              <path d="M1 4.5C3.2 2.9 5.7 2 8 2c2.3 0 4.8.9 7 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                              <path d="M3 7c1.5-1 3.3-1.5 5-1.5S11.5 6 13 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                              <path d="M6 9.5c.6-.4 1.3-.6 2-.6s1.4.2 2 .6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                              <circle cx="8" cy="10.2" r="0.8" fill="currentColor"/>
                            </svg>
                            {/* Batería */}
                            <svg width="24" height="12" viewBox="0 0 24 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                              <rect x="1" y="2" width="18" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                              <rect x="3" y="4" width="14" height="4" rx="1" fill="currentColor"/>
                              <rect x="20" y="4" width="2.5" height="4" rx="0.7" fill="currentColor"/>
                            </svg>
                          </div>
                        </div>
                        {/* Título chat */}
                        <div className="flex items-center gap-2 px-3 py-2">
                          <ChevronLeft size={20} className="opacity-90" />
                          <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                            <span className="text-white text-sm font-medium">M</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="truncate text-[15px] leading-tight font-medium font-work-sans">Mía</div>
                            <div className="text-[11px] leading-tight opacity-90 font-work-sans">en línea</div>
                          </div>
                          <div className="flex items-center gap-3 pr-1">
                            <Video size={18} className="opacity-90" />
                            <Phone size={18} className="opacity-90" />
                            <MoreVertical size={18} className="opacity-90" />
                          </div>
                        </div>
                      </div>

                      {/* Mensajes */}
                      <div className="messages-container flex-1 bg-[#E4DDD6] px-2 py-3 space-y-2 overflow-y-auto scrollbar-hide" style={{ scrollBehavior: 'smooth' }}>
                        {casoActivo === 'agendamiento' && (
                          <>
                            {[
                              { user: true, text: 'Hola, necesito agendar una cita para servicio', time: '10:30 AM' },
                              { user: false, text: '¡Hola! Con gusto te ayudo a agendar tu cita. ¿Para qué tipo de servicio necesitas la cita?', time: '10:30 AM' },
                              { user: true, text: 'Servicio de 10,000 km', time: '10:31 AM' },
                              { user: false, text: 'Perfecto. Tengo disponibilidad para mañana a las 9:00 AM o 2:00 PM. ¿Qué horario te funciona mejor?', time: '10:31 AM' },
                              { user: true, text: 'Me gustaría a las 9:00 AM', time: '10:32 AM' },
                              { user: false, text: '¡Excelente! Tu cita quedó agendada para mañana a las 9:00 AM. Te enviaré un recordatorio una hora antes. ¿Necesitas algo más?', time: '10:32 AM' }
                            ].slice(Math.max(0, visibleMessages - 6), visibleMessages).map((msg, idx) => (
                              <div key={idx} className={`flex ${msg.user ? 'justify-end' : 'justify-start'} animate-slideIn`}>
                                <div className={`${msg.user ? 'bg-[#DCF8C6]' : 'bg-white'} rounded-2xl px-3 py-2 max-w-[78%] shadow`}> 
                                  <div className="text-[15px] font-work-sans">{msg.text}</div>
                                  <div className="mt-1 flex items-center justify-end gap-1">
                                    <span className="text-[10px] text-gray-500 font-work-sans">{msg.time}</span>
                                    {msg.user && (
                                      <span className="text-[10px] text-blue-500">✓✓</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </>
                        )}

                        {casoActivo === 'seguimiento' && (
                          <>
                            {visibleMessages >= 1 && (
                              <div className="flex justify-start animate-slideIn">
                                <div className="bg-white rounded-2xl px-3 py-2 max-w-[78%] shadow">
                                  <div className="text-[15px] font-work-sans">Hola Juan, se acerca tu servicio de 50,000 km. ¿Quieres que te ayude a agendarlo?</div>
                                  <div className="mt-1 text-right text-[10px] text-gray-500 font-work-sans">10:32 AM</div>
                                </div>
                              </div>
                            )}
                            {visibleMessages >= 2 && (
                              <div className="flex justify-end animate-slideIn">
                                <div className="bg-[#DCF8C6] rounded-2xl px-3 py-2 max-w-[78%] shadow">
                                  <div className="text-[15px] font-work-sans">Sí, me gustaría agendarlo esta semana</div>
                                  <div className="mt-1 text-right text-[10px] text-gray-500 font-work-sans">10:32 AM</div>
                                </div>
                              </div>
                            )}
                            {visibleMessages >= 3 && (
                              <div className="flex justify-start animate-slideIn">
                                <div className="bg-white rounded-2xl px-3 py-2 max-w-[78%] shadow">
                                  <div className="text-[15px] font-work-sans">Perfecto, tengo disponibilidad el jueves a las 9:00 AM o 2:00 PM. ¿Cuál prefieres?</div>
                                  <div className="mt-1 text-right text-[10px] text-gray-500 font-work-sans">10:33 AM</div>
                                </div>
                              </div>
                            )}
                            {visibleMessages >= 4 && (
                              <div className="flex justify-end animate-slideIn">
                                <div className="bg-[#DCF8C6] rounded-2xl px-3 py-2 max-w-[78%] shadow">
                                  <div className="text-[15px] font-work-sans">Jueves a las 9:00 AM</div>
                                  <div className="mt-1 text-right text-[10px] text-gray-500 font-work-sans">10:34 AM</div>
                                </div>
                              </div>
                            )}
                            {visibleMessages >= 5 && (
                              <div className="flex justify-start animate-slideIn">
                                <div className="bg-white rounded-2xl px-3 py-2 max-w-[78%] shadow">
                                  <div className="text-[15px] font-work-sans">Listo, te agendé el jueves a las 9:00 AM. Te enviaré un recordatorio un día antes. ¿Necesitas algo más?</div>
                                  <div className="mt-1 text-right text-[10px] text-gray-500 font-work-sans">10:34 AM</div>
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {casoActivo === 'nps' && (
                          <>
                            {visibleMessages >= 1 && (
                              <div className="flex justify-start animate-slideIn">
                                <div className="bg-white rounded-2xl px-3 py-2 max-w-[78%] shadow">
                                  <div className="text-[15px] font-work-sans">Hola María, ¿qué tal ha funcionado tu auto después del servicio? En escala del 0-10, ¿qué tan probable es que nos recomiendes?</div>
                                  <div className="mt-1 text-right text-[10px] text-gray-500 font-work-sans">10:34 AM</div>
                                </div>
                              </div>
                            )}
                            {visibleMessages >= 2 && (
                              <div className="flex justify-end animate-slideIn">
                                <div className="bg-[#DCF8C6] rounded-2xl px-3 py-2 max-w-[78%] shadow">
                                  <div className="text-[15px] font-work-sans">¡Todo excelente! Les doy un 10, el servicio fue muy rápido</div>
                                  <div className="mt-1 text-right text-[10px] text-gray-500 font-work-sans">10:34 AM</div>
                                </div>
                              </div>
                            )}
                            {visibleMessages >= 3 && (
                              <div className="flex justify-start animate-slideIn">
                                <div className="bg-white rounded-2xl px-3 py-2 max-w-[78%] shadow">
                                  <div className="text-[15px] font-work-sans">¡Gracias por tu feedback! Te recordamos que tu próximo servicio será en 5,000 km. ¿Te gustaría que te agende un recordatorio?</div>
                                  <div className="mt-1 text-right text-[10px] text-gray-500 font-work-sans">10:35 AM</div>
                                </div>
                              </div>
                            )}
                            {visibleMessages >= 4 && (
                              <div className="flex justify-end animate-slideIn">
                                <div className="bg-[#DCF8C6] rounded-2xl px-3 py-2 max-w-[78%] shadow">
                                  <div className="text-[15px] font-work-sans">Sí, por favor</div>
                                  <div className="mt-1 text-right text-[10px] text-gray-500 font-work-sans">10:35 AM</div>
                                </div>
                              </div>
                            )}
                            {visibleMessages >= 5 && (
                              <div className="flex justify-start animate-slideIn">
                                <div className="bg-white rounded-2xl px-3 py-2 max-w-[78%] shadow">
                                  <div className="text-[15px] font-work-sans">Listo, te enviaré un recordatorio cuando estés cerca de los 5,000 km. ¡Que tengas un excelente día!</div>
                                  <div className="mt-1 text-right text-[10px] text-gray-500 font-work-sans">10:36 AM</div>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Input inferior */}
                      <div className="bg-[#F0F2F5] px-3 py-2 flex items-center gap-2 border-t border-black/5">
                        <Smile size={18} className="text-gray-500" />
                        <Paperclip size={18} className="text-gray-500" />
                        <Camera size={18} className="text-gray-500" />
                        <input
                          type="text"
                          placeholder="Mensaje"
                          className="flex-1 rounded-full bg-white px-4 py-2 text-sm font-work-sans"
                          disabled
                        />
                        <Mic size={18} className="text-gray-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Panel lateral con títulos y descripciones sincronizados */}
              <div className="mt-8 md:mt-0 md:absolute md:left-[calc(100%+28px)] md:top-1/2 md:-translate-y-1/2 flex flex-col items-center md:items-start gap-6 w-full max-w-sm md:w-[520px]">
                {flowsMeta.map((flow) => {
                  const isActive = casoActivo === flow.key;
                  return (
                    <div key={flow.key} className="transition-all duration-300 w-full md:w-auto text-center md:text-left">
                      <div className="flex items-center gap-3 justify-center md:justify-start">
                        <span className={`inline-flex items-center justify-center h-7 w-7 rounded-md text-sm font-semibold flex-shrink-0 ${isActive ? 'bg-gray-900 text-white' : 'bg-gray-300 text-gray-700'}`}>{flow.number}</span>
                        <h4 className={`font-moranga text-xl md:text-[28px] leading-tight whitespace-nowrap ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>{flow.title}</h4>
                      </div>
                      <p className={`mt-2 font-work-sans text-base md:text-lg leading-relaxed ${isActive ? 'text-gray-700' : 'text-gray-500/80'}`}>{flow.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección Dashboard Preview */}
      <section id="caracteristicas" className="relative py-8 md:py-12 lg:py-14 bg-transparent">
        {/* gradientes removidos */}
        <div className="relative max-w-7xl mx-auto px-4 md:px-8">
          {/* Header */}
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-moranga font-semibold text-gray-900 mb-4 md:mb-6">
              Ve todo desde un solo lugar
            </h2>
            <p className="text-lg md:text-xl text-gray-600 font-work-sans max-w-3xl mx-auto">
              El dashboard de Muvi te da control total sobre Mía y visibilidad completa de tu operación.
            </p>
          </div>
          
          {/* Dashboard Mockup + Features */}
          <div className="grid lg:grid-cols-2 gap-8 md:gap-16 items-center">
            {/* Dashboard Mockup */}
            <div className="order-2 lg:order-1">
              {/* Dashboard Container */}
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden hover:shadow-3xl transition-all duration-300">
                {/* Header del Dashboard */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 md:px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold font-work-sans text-sm md:text-base">Dashboard Muvi</h3>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-blue-100 text-xs md:text-sm font-work-sans">Mía en línea</span>
                    </div>
                  </div>
                </div>
                
                {/* Dashboard Content */}
                <div className="p-4 md:p-6 space-y-4 md:space-y-6">
                  {/* Métricas Row - Basado en dashboard real */}
                  <div className="grid grid-cols-3 gap-2 md:gap-4">
                    <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                      <div className="flex items-center justify-between mb-2 md:mb-3">
                        <h4 className="text-xs md:text-sm font-medium text-gray-700 font-work-sans">Estado de Citas</h4>
                        <span className="text-green-600 text-[10px] md:text-xs">📅</span>
                      </div>
                      <div className="space-y-1 md:space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs md:text-sm text-gray-600 font-work-sans">Pendientes</span>
                          <span className="text-sm md:text-lg font-bold text-gray-600 font-work-sans">5</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs md:text-sm text-gray-600 font-work-sans">Confirmadas</span>
                          <span className="text-sm md:text-lg font-bold text-blue-600 font-work-sans">8</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs md:text-sm text-gray-600 font-work-sans">Finalizadas</span>
                          <span className="text-sm md:text-lg font-bold text-green-600 font-work-sans">3</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3 md:p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs md:text-sm font-medium text-gray-700 font-work-sans">Satisfacción</h4>
                          <span className="text-green-600 text-[10px] md:text-xs">📊</span>
                        </div>
                        <div className="text-lg md:text-2xl font-bold text-blue-600 font-work-sans">72</div>
                        <div className="text-xs md:text-sm text-gray-600 font-work-sans">NPS</div>
                      </div>
                      <div className="flex items-center mt-1">
                        <span className="text-green-600 text-xs font-work-sans">+35% ↗</span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3 md:p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs md:text-sm font-medium text-gray-700 font-work-sans">Ocupación</h4>
                          <span className="text-blue-600 text-[10px] md:text-xs">⚙️</span>
                        </div>
                        <div className="text-lg md:text-2xl font-bold text-blue-600 font-work-sans">67%</div>
                        <div className="text-xs md:text-sm text-gray-600 font-work-sans">del Taller</div>
                      </div>
                      <div className="text-xs text-green-600 font-work-sans">Buena utilización</div>
                    </div>
                  </div>
                  
                  {/* Gráfico de Tendencias */}
                  <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                    <div className="flex items-center justify-between mb-3 md:mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 font-work-sans text-sm md:text-base">Tendencia de Citas</h4>
                        <p className="text-xs md:text-sm text-gray-600 font-work-sans">Comparación con el mes anterior</p>
                      </div>
                      <div className="text-xs md:text-sm text-gray-600 font-work-sans">+25%</div>
                    </div>
                    
                    {/* Simulación de gráfico simple */}
                    <div className="h-16 md:h-24 flex items-end justify-between gap-1">
                      <div className="bg-blue-300 w-1 md:w-2" style={{height: '60%'}}></div>
                      <div className="bg-blue-400 w-1 md:w-2" style={{height: '40%'}}></div>
                      <div className="bg-blue-500 w-1 md:w-2" style={{height: '80%'}}></div>
                      <div className="bg-blue-400 w-1 md:w-2" style={{height: '55%'}}></div>
                      <div className="bg-blue-600 w-1 md:w-2" style={{height: '90%'}}></div>
                      <div className="bg-blue-500 w-1 md:w-2" style={{height: '70%'}}></div>
                      <div className="bg-blue-400 w-1 md:w-2" style={{height: '65%'}}></div>
                      <div className="bg-blue-600 w-1 md:w-2" style={{height: '95%'}}></div>
                      <div className="bg-blue-500 w-1 md:w-2" style={{height: '75%'}}></div>
                      <div className="bg-blue-400 w-1 md:w-2" style={{height: '50%'}}></div>
                      <div className="bg-blue-500 w-1 md:w-2" style={{height: '85%'}}></div>
                      <div className="bg-blue-600 w-1 md:w-2" style={{height: '100%'}}></div>
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
            <div className="order-1 lg:order-2 space-y-6 md:space-y-8">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-xl md:text-2xl">📊</span>
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 font-work-sans">
                    Métricas en tiempo real
                  </h3>
                  <p className="text-gray-600 font-work-sans text-sm md:text-base">
                    Ve cuántas citas se han agendado, conversaciones activas y nivel de satisfacción de tus clientes.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-xl md:text-2xl">💬</span>
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 font-work-sans">
                    Control total de Mía
                  </h3>
                  <p className="text-gray-600 font-work-sans text-sm md:text-base">
                    Pausa, activa o ajusta cómo responde Mía. Tú tienes el control completo de tu asistente virtual.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-xl md:text-2xl">📅</span>
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 font-work-sans">
                    Historial completo
                  </h3>
                  <p className="text-gray-600 font-work-sans text-sm md:text-base">
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
      <section id="faqs" className="relative py-12 md:py-20 bg-transparent">
        {/* gradientes removidos */}
        <div className="relative max-w-4xl mx-auto px-4 md:px-6">
          <h2 className="text-3xl md:text-4xl font-moranga font-bold text-center mb-8 md:mb-12">Preguntas Frecuentes</h2>
          <div className="space-y-3 md:space-y-4">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button 
                onClick={() => setOpenFaq(openFaq === 'faq1' ? '' : 'faq1')}
                className="w-full flex items-center justify-between p-4 md:p-6 text-left bg-white hover:bg-gray-100 transition-colors"
              >
                <h3 className="text-lg md:text-xl font-bold font-work-sans">¿Cómo funciona Mía?</h3>
                <svg 
                  className={`w-5 h-5 md:w-6 md:h-6 transform transition-transform ${openFaq === 'faq1' ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openFaq === 'faq1' && (
                <div className="p-4 md:p-6 pt-0 text-gray-600 animate-slideDown font-work-sans text-sm md:text-base">
                  Mía utiliza inteligencia artificial avanzada para gestionar llamadas, agendar citas y dar seguimiento a tus clientes de manera automática, 24/7.
                </div>
              )}
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button 
                onClick={() => setOpenFaq(openFaq === 'faq2' ? '' : 'faq2')}
                className="w-full flex items-center justify-between p-4 md:p-6 text-left bg-white hover:bg-gray-100 transition-colors"
              >
                <h3 className="text-lg md:text-xl font-bold font-work-sans">¿Cuánto tiempo toma la implementación?</h3>
                <svg 
                  className={`w-5 h-5 md:w-6 md:h-6 transform transition-transform ${openFaq === 'faq2' ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openFaq === 'faq2' && (
                <div className="p-4 md:p-6 pt-0 text-gray-600 animate-slideDown font-work-sans text-sm md:text-base">
                  La implementación es rápida y sencilla, en menos de 24 horas Mía estará funcionando en tu concesionario.
                </div>
              )}
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button 
                onClick={() => setOpenFaq(openFaq === 'faq3' ? '' : 'faq3')}
                className="w-full flex items-center justify-between p-4 md:p-6 text-left bg-white hover:bg-gray-100 transition-colors"
              >
                <h3 className="text-lg md:text-xl font-bold font-work-sans">¿Se integra con mi sistema actual?</h3>
                <svg 
                  className={`w-5 h-5 md:w-6 md:h-6 transform transition-transform ${openFaq === 'faq3' ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openFaq === 'faq3' && (
                <div className="p-4 md:p-6 pt-0 text-gray-600 animate-slideDown font-work-sans text-sm md:text-base">
                  Sí, Mía se integra con los sistemas más populares de gestión de concesionarios y CRMs del mercado.
                </div>
              )}
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button 
                onClick={() => setOpenFaq(openFaq === 'faq4' ? '' : 'faq4')}
                className="w-full flex items-center justify-between p-4 md:p-6 text-left bg-white hover:bg-gray-100 transition-colors"
              >
                <h3 className="text-lg md:text-xl font-bold font-work-sans">¿Qué soporte ofrecen?</h3>
                <svg 
                  className={`w-5 h-5 md:w-6 md:h-6 transform transition-transform ${openFaq === 'faq4' ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openFaq === 'faq4' && (
                <div className="p-4 md:p-6 pt-0 text-gray-600 animate-slideDown font-work-sans text-sm md:text-base">
                  Ofrecemos soporte técnico 24/7 y un equipo dedicado para asegurar que Mía funcione perfectamente en tu negocio.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer className="bg-white text-gray-700 py-8">
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

