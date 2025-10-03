"use client"

import { Sidebar } from "@/components/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { GlobalNotifications } from "@/components/GlobalNotifications"
// import { VoiceflowWidget } from "@/components/voiceflow-widget"

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
      <Toaster />
      <GlobalNotifications />
      {/* <VoiceflowWidget /> */}
    </div>
  )
} 