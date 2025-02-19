"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Car,
  Calendar,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Wrench,
  FileText
} from "lucide-react"

const menuItems = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Clientes", href: "/clientes", icon: Users },
  { title: "Vehículos", href: "/vehiculos", icon: Car },
  { title: "Citas", href: "/citas", icon: Calendar },
  { title: "Servicios", href: "/servicios", icon: Wrench },
  { title: "Conversaciones", href: "/conversaciones", icon: MessageSquare },
  { title: "Reportes", href: "/reportes", icon: FileText },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Si estamos en /login o /register, no renderizar el Sidebar
  if (pathname === "/login/" || pathname === "/register/") return (
      <div></div>
  )

  return (
      <div className={cn(
          "h-screen border-r bg-white transition-all duration-300",
          isCollapsed ? "w-[80px]" : "w-[280px]"
      )}>
        <div className="flex h-full flex-col">
          <div className="p-6 flex items-center border-b">
            {!isCollapsed && <h1 className="text-xl font-bold flex-1">EdgarAI</h1>}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors ml-auto"
            >
              {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        "flex items-center space-x-3 p-4 rounded-lg transition-colors",
                        pathname === item.href ? "bg-primary/10 text-primary hover:bg-primary/20" : "hover:bg-gray-100",
                        isCollapsed && "justify-center p-3"
                    )}
                >
                  <item.icon className={cn(
                      "h-6 w-6",
                      pathname === item.href ? "text-primary" : "text-gray-500"
                  )} />
                  {!isCollapsed && <span className="text-sm font-medium">{item.title}</span>}
                </Link>
            ))}
          </nav>
        </div>
      </div>
  )
}
