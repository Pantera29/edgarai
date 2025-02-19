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
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          EdgarAI - Sistema Inteligente para Talleres Mecánicos
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          <div className="feature-card p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Gestión Inteligente</h2>
            <p>Optimiza la gestión de tu taller con inteligencia artificial</p>
          </div>
          
          <div className="feature-card p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Control Total</h2>
            <p>Administra citas, clientes y servicios en un solo lugar</p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link 
            href="/backoffice" 
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700"
          >
            Acceder al Sistema
          </Link>
        </div>
      </div>
    </main>
  )
}

