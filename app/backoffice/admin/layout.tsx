'use client';

import { Separator } from "@/components/ui/separator";

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="space-y-6 p-10 pb-16">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Administración</h2>
        <p className="text-muted-foreground">
          Gestiona la configuración y servicios de tu taller
        </p>
      </div>
      <Separator className="my-6" />
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
} 