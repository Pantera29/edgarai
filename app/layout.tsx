import "@/app/globals.css"
import { Outfit, Work_Sans, Fraunces } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Toaster } from "@/components/ui/toaster"


const outfit = Outfit({ 
  subsets: ["latin"],
  variable: '--font-outfit'
})

// Configurar Work Sans para el contenido
const workSans = Work_Sans({ 
  subsets: ["latin"],
  variable: '--font-work-sans'
})

// Configurar Fraunces para los títulos
const fraunces = Fraunces({ 
  subsets: ["latin"],
  variable: '--font-moranga',
  weight: ['400', '500', '600', '700']
})

export const metadata = {
  title: 'MuviAI - Sistema Inteligente para Talleres',
  description: 'Sistema inteligente para la gestión de talleres mecánicos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${outfit.variable} ${workSans.variable} ${fraunces.variable}`}>
        <ThemeProvider>
          <TooltipProvider>
            {children}
            <Toaster />
            <Analytics />
            <SpeedInsights />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

