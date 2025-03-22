"use client";

import { LineChart, Line, BarChart, Bar, PieChart, Pie, ResponsiveContainer } from 'recharts';
import { Car, Calendar, Users, Wrench, BarChart as BarChartIcon, PieChart as PieChartIcon } from 'lucide-react';

// Datos de ejemplo para visualizaciones
const lineData = [
  { name: 'Ene', value: 40 },
  { name: 'Feb', value: 30 },
  { name: 'Mar', value: 45 },
  { name: 'Abr', value: 50 },
  { name: 'May', value: 65 },
  { name: 'Jun', value: 60 },
  { name: 'Jul', value: 80 },
  { name: 'Ago', value: 75 },
  { name: 'Sep', value: 90 }
];

const barData = [
  { name: 'Tipo A', value: 20 },
  { name: 'Tipo B', value: 35 },
  { name: 'Tipo C', value: 15 },
  { name: 'Tipo D', value: 25 }
];

const pieData = [
  { name: 'Pendiente', value: 30, fill: '#38bdf8' },
  { name: 'Completado', value: 50, fill: '#4ade80' },
  { name: 'Cancelado', value: 20, fill: '#f87171' }
];

export function MockDashboard() {
  return (
    <div className="w-full h-full grid grid-cols-3 gap-4 p-8">
      {/* Header del Dashboard */}
      <div className="col-span-3 flex justify-between items-center mb-2">
        <div className="text-2xl font-bold text-white opacity-80">Dashboard</div>
        <div className="flex gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-500/50"></div>
          <div className="w-24 h-8 rounded-md bg-blue-500/30"></div>
        </div>
      </div>

      {/* Tarjetas de métricas */}
      <div className="col-span-1 bg-white/20 rounded-xl p-4 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm font-medium text-white">Total Clientes</div>
          <Users className="h-4 w-4 text-blue-300" />
        </div>
        <div className="text-2xl font-bold text-white">1,284</div>
        <div className="h-10 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData.slice(0, 5)}>
              <Line type="monotone" dataKey="value" stroke="#38bdf8" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="col-span-1 bg-white/20 rounded-xl p-4 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm font-medium text-white">Vehículos Registrados</div>
          <Car className="h-4 w-4 text-green-300" />
        </div>
        <div className="text-2xl font-bold text-white">2,156</div>
        <div className="h-10 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData.slice(2, 7)}>
              <Line type="monotone" dataKey="value" stroke="#4ade80" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="col-span-1 bg-white/20 rounded-xl p-4 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm font-medium text-white">Citas Pendientes</div>
          <Calendar className="h-4 w-4 text-purple-300" />
        </div>
        <div className="text-2xl font-bold text-white">58</div>
        <div className="h-10 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData.slice(4, 9)}>
              <Line type="monotone" dataKey="value" stroke="#a78bfa" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráficos */}
      <div className="col-span-2 bg-white/20 rounded-xl p-4 backdrop-blur-sm h-64">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm font-medium text-white">Ingresos Mensuales</div>
          <BarChartIcon className="h-4 w-4 text-blue-300" />
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={lineData}>
              <Bar dataKey="value" fill="#38bdf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="col-span-1 bg-white/20 rounded-xl p-4 backdrop-blur-sm h-64">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm font-medium text-white">Servicios por Estado</div>
          <PieChartIcon className="h-4 w-4 text-green-300" />
        </div>
        <div className="h-52 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lista de próximas citas */}
      <div className="col-span-3 bg-white/20 rounded-xl p-4 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm font-medium text-white">Próximas Citas</div>
          <Wrench className="h-4 w-4 text-purple-300" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex justify-between items-center bg-white/10 p-2 rounded-md">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500/50"></div>
                <div>
                  <div className="text-sm font-medium text-white">Cliente {item}</div>
                  <div className="text-xs text-white/70">Servicio de Mantenimiento</div>
                </div>
              </div>
              <div className="text-xs text-white/70">Hoy, 14:3{item}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 