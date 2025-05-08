import "@/app/globals.css"
import { Inter, Outfit } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Analytics } from "@vercel/analytics/react"

const inter = Inter({ subsets: ["latin"] })
const outfit = Outfit({ 
  subsets: ["latin"],
  variable: '--font-outfit'
})

export const metadata = {
  title: 'EdgarAI - Sistema Inteligente para Talleres',
  description: 'Sistema inteligente para la gestión de talleres mecánicos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} ${outfit.variable}`}>
        <ThemeProvider>
          <TooltipProvider>
            {children}
            <Analytics />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

