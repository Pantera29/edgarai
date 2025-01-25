"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  Search,
  Bell,
  MessageSquare,
  Calendar,
  User,
  ChevronDown,
  Package,
  Users,
  Car,
  Settings,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Wrench,
  FileText,
  CalendarX,
  type LucideIcon
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { FormLabel } from "@/components/ui/form"

interface MainNavProps {
  pendingAppointments?: number
  unreadMessages?: number
}

export const mainNavItems = [
  {
    title: "Citas",
    href: "/citas",
    icon: Calendar,
    description: "Gestión de citas y agenda"
  },
  {
    title: "Clientes",
    href: "/clientes",
    icon: Users,
    description: "Gestión de clientes"
  },
  {
    title: "Vehículos",
    href: "/vehiculos",
    icon: Car,
    description: "Gestión de vehículos"
  },
  {
    title: "Productos",
    href: "/productos",
    icon: Package,
    description: "Gestión de inventario y productos"
  },
  {
    title: "Configuración",
    href: "/admin",
    icon: Settings,
    description: "Configuración del sistema"
  }
]

export function MainNav({ pendingAppointments = 0, unreadMessages = 0 }) {
  const pathname = usePathname()

  return (
    <div className="border-b bg-white shadow-sm">
      <div className="flex h-16 items-center px-4">
        {/* Logo */}
        <div className="flex items-center space-x-4">
          <Link href="/" className="font-bold text-xl">
            EdgarAI
          </Link>
        </div>

        {/* Navegación principal */}
        <nav className="mx-6 flex items-center space-x-4 lg:space-x-6">
          <Link
            href="/"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary relative",
              pathname === "/" 
                ? "text-primary after:absolute after:bottom-[-24px] after:left-0 after:h-[2px] after:w-full after:bg-primary"
                : "text-muted-foreground"
            )}
          >
            Inicio
          </Link>
          <Link
            href="/clientes"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary relative",
              pathname === "/clientes"
                ? "text-primary after:absolute after:bottom-[-24px] after:left-0 after:h-[2px] after:w-full after:bg-primary"
                : "text-muted-foreground"
            )}
          >
            Clientes
          </Link>
          <Link
            href="/vehiculos"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary relative",
              pathname === "/vehiculos"
                ? "text-primary after:absolute after:bottom-[-24px] after:left-0 after:h-[2px] after:w-full after:bg-primary"
                : "text-muted-foreground"
            )}
          >
            Vehículos
          </Link>
          <Link
            href="/productos"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary relative",
              pathname === "/productos"
                ? "text-primary after:absolute after:bottom-[-24px] after:left-0 after:h-[2px] after:w-full after:bg-primary"
                : "text-muted-foreground"
            )}
          >
            Productos
          </Link>
          <Link
            href="/citas"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary relative flex items-center",
              pathname === "/citas"
                ? "text-primary after:absolute after:bottom-[-24px] after:left-0 after:h-[2px] after:w-full after:bg-primary"
                : "text-muted-foreground"
            )}
          >
            Citas
            {pendingAppointments > 0 && (
              <Badge 
                variant="secondary" 
                className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center"
              >
                {pendingAppointments}
              </Badge>
            )}
          </Link>
          <Link
            href="/conversaciones"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary relative flex items-center",
              pathname === "/conversaciones"
                ? "text-primary after:absolute after:bottom-[-24px] after:left-0 after:h-[2px] after:w-full after:bg-primary"
                : "text-muted-foreground"
            )}
          >
            Conversaciones
            {unreadMessages > 0 && (
              <Badge 
                variant="secondary" 
                className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center"
              >
                {unreadMessages}
              </Badge>
            )}
          </Link>
        </nav>

        {/* Búsqueda global */}
        <div className="ml-auto flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              className="pl-8 w-[300px]"
            />
          </div>

          {/* Notificaciones */}
          <button className="relative p-2 hover:bg-accent rounded-full">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
          </button>

          {/* Perfil de usuario */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center space-x-2 hover:bg-accent p-2 rounded-full">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Perfil</DropdownMenuItem>
              <DropdownMenuItem>Configuración</DropdownMenuItem>
              <DropdownMenuItem>Cerrar sesión</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

