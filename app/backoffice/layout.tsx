"use client"

import { Sidebar } from "@/components/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { VoiceflowWidget } from "@/components/voiceflow-widget"

export default function BackofficeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1">
        {children}
      </main>
      <VoiceflowWidget />
    </div>
  )
} 