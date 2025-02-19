'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { cn } from "@/lib/utils";

interface MetricsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  description: string;
  trend?: number[];
  color?: string;
  onClick?: () => void;
  className?: string;
}

export function MetricsCard({
  title,
  value,
  icon,
  description,
  trend = [],
  color = "slate",
  onClick,
  className
}: MetricsCardProps) {
  const data = trend.map((value) => ({ value }));

  return (
    <Card 
      className={cn(
        "transition-all duration-200 hover:shadow-md",
        onClick && "cursor-pointer hover:scale-[1.02]",
        className
      )}
      onClick={onClick}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <div className={`text-${color}-600`}>{icon}</div>
          </CardHeader>
        </TooltipTrigger>
        <TooltipContent>
          <p>{description}</p>
        </TooltipContent>
      </Tooltip>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-2xl font-bold">{value}</div>
          </div>
          <div className="h-12 w-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={`var(--${color}-600)`}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 