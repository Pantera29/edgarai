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
  FileText,
  Settings,
  CalendarX,
  Package,
  Home,
  Receipt,
  ClipboardList,
  type LucideIcon
} from "lucide-react"

interface MenuItem {
  title: string;
  href?: string;
  icon: LucideIcon;
  items?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard
  },
  {
    title: "Citas",
    href: "/citas",
    icon: Calendar
  },
  {
    title: "Servicios Recomendados",
    href: "/servicios-recomendados",
    icon: ClipboardList
  },
  {
    title: "Clientes",
    href: "/clientes",
    icon: Users
  },
  {
    title: "Vehículos",
    href: "/vehiculos",
    icon: Car
  },
  {
    title: "Productos",
    href: "/productos",
    icon: Package
  },
  {
    title: "Servicios",
    href: "/servicios",
    icon: Wrench
  },
  {
    title: "Conversaciones",
    href: "/conversaciones",
    icon: MessageSquare
  },
  {
    title: "Transacciones",
    href: "/transacciones",
    icon: Receipt
  }
];

export function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const adminLinks = [
    {
      href: '/admin/configuracion',
      label: 'Configuración',
      icon: Settings,
    },
    {
      href: '/admin/fechas-bloqueadas',
      label: 'Fechas Bloqueadas',
      icon: CalendarX,
    }
  ];

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
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            item.href ? (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 p-4 rounded-lg transition-colors",
                  pathname === item.href
                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                    : "hover:bg-gray-100",
                  isCollapsed && "justify-center p-3"
                )}
              >
                <item.icon className={cn(
                  "h-6 w-6",
                  pathname === item.href ? "text-primary" : "text-gray-500"
                )} />
                {!isCollapsed && (
                  <span className="text-sm font-medium">{item.title}</span>
                )}
              </Link>
            ) : (
              <div key={item.title} className="space-y-1">
                {item.items?.map((subItem) => (
                  <Link
                    key={subItem.href}
                    href={subItem.href!}
                    className={cn(
                      "flex items-center space-x-3 p-4 rounded-lg transition-colors",
                      pathname === subItem.href
                        ? "bg-primary/10 text-primary hover:bg-primary/20"
                        : "hover:bg-gray-100",
                      isCollapsed && "justify-center p-3"
                    )}
                  >
                    <subItem.icon className={cn(
                      "h-6 w-6",
                      pathname === subItem.href ? "text-primary" : "text-gray-500"
                    )} />
                    {!isCollapsed && (
                      <span className="text-sm font-medium">{subItem.title}</span>
                    )}
                  </Link>
                ))}
              </div>
            )
          ))}
        </nav>

        <div className="space-y-4">
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              Administración
            </h2>
            <div className="space-y-1">
              {adminLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center rounded-lg px-3 py-2 transition-all hover:text-slate-900 dark:hover:text-slate-50',
                    pathname === link.href
                      ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50'
                      : 'text-slate-500 dark:text-slate-400'
                  )}
                >
                  <link.icon className="mr-2 h-4 w-4" />
                  {!isCollapsed && link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

