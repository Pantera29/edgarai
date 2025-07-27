"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis, CartesianGrid } from "recharts"

interface CohortRetentionData {
  cohort_label: string;
  cohort_month: string;
  cohort_size: number;
  retention_rates: Record<string, number>;
  retention_counts: Record<string, number>;
  has_complete_data: boolean;
}

interface CohortRetentionChartProps {
  cohorts: CohortRetentionData[];
}

export function CohortRetentionChart({ cohorts }: CohortRetentionChartProps) {
  // Ordenar cohorts por fecha (más antiguos primero para colores más claros)
  const sortedCohorts = [...cohorts].sort((a, b) => 
    new Date(a.cohort_month).getTime() - new Date(b.cohort_month).getTime()
  );
  
  // Preparar datos para el gráfico
  const chartData = prepareChartData(sortedCohorts);
  
  // Configuración de colores para los cohorts (azules con diferentes tonos)
  const chartConfig = createChartConfig(sortedCohorts);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Retención por Cohort</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="period" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const periodMap: Record<string, string> = {
                  '0m': '0m',
                  '0_6m': '0-6m',
                  '6_12m': '6-12m', 
                  '12_18m': '12-18m',
                  '18_24m': '18-24m'
                };
                return periodMap[value] || value;
              }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${value.toFixed(2)}%`}
            />
            <ChartTooltip
              content={<ChartTooltipContent indicator="line" />}
              cursor={false}
            />
            {sortedCohorts.map((cohort, index) => (
              <Line
                key={cohort.cohort_label}
                type="monotone"
                dataKey={cohort.cohort_label}
                stroke={`var(--color-${cohort.cohort_label})`}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function prepareChartData(cohorts: CohortRetentionData[]) {
  // Obtener todos los períodos únicos
  const periods = new Set<string>();
  cohorts.forEach(cohort => {
    Object.keys(cohort.retention_rates).forEach(period => {
      periods.add(period);
    });
  });

  // Ordenar períodos cronológicamente
  const sortedPeriods = Array.from(periods).sort((a, b) => {
    const aNum = parseInt(a.split('_')[0]);
    const bNum = parseInt(b.split('_')[0]);
    return aNum - bNum;
  });

  // Crear datos para el gráfico, empezando en 0
  const chartData = [];
  
  // Agregar punto inicial en 0 para todos los cohorts
  const initialPoint: any = { period: '0m' };
  cohorts.forEach(cohort => {
    initialPoint[cohort.cohort_label] = 0;
  });
  chartData.push(initialPoint);
  
  // Agregar los períodos con datos reales
  sortedPeriods.forEach(period => {
    const dataPoint: any = { period };
    
    cohorts.forEach(cohort => {
      // Convertir de decimal a porcentaje (ej: 0.65 -> 65)
      const retentionRate = cohort.retention_rates[period];
      dataPoint[cohort.cohort_label] = retentionRate ? retentionRate * 100 : null;
    });
    
    chartData.push(dataPoint);
  });
  
  return chartData;
}

function createChartConfig(cohorts: CohortRetentionData[]) {
  const config: Record<string, { label: string; color: string }> = {};
  
  // Usar la escala blue de shadcn/ui
  const blueShades = [
    'hsl(213, 100%, 96%)', // blue-50
    'hsl(214, 95%, 93%)',  // blue-100
    'hsl(213, 97%, 87%)',  // blue-200
    'hsl(212, 96%, 78%)',  // blue-300
    'hsl(213, 94%, 68%)',  // blue-400
    'hsl(217, 91%, 60%)',  // blue-500
    'hsl(221, 83%, 53%)',  // blue-600
    'hsl(224, 76%, 48%)',  // blue-700
    'hsl(226, 71%, 40%)',  // blue-800
    'hsl(224, 64%, 33%)',  // blue-900
    'hsl(226, 57%, 21%)',  // blue-950
  ];
  
  cohorts.forEach((cohort, index) => {
    // Distribuir los cohorts a través de la escala de colores
    const colorIndex = Math.floor((index / (cohorts.length - 1)) * (blueShades.length - 1));
    const color = blueShades[colorIndex] || blueShades[blueShades.length - 1];
    
    config[cohort.cohort_label] = {
      label: cohort.cohort_label,
      color: color
    };
  });
  
  return config;
} 