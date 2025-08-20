"use client"

import { useState, useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation" // Importa useSearchParams
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Car,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Wrench,
  Settings,
  CalendarX,
  Receipt,
  ClipboardList,
  BarChart,
  Bell,
  LogOut,
  type LucideIcon,
  MessageSquare,
  Target,
  Building2,
  Monitor,
  AlertTriangle,
  TrendingUp,
  Activity
} from "lucide-react"
import Image from "next/image"

interface MenuItem {
  title: string;
  href?: string;
  icon: LucideIcon;
  items?: MenuItem[];
  isSection?: boolean;
}

const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    href: "/backoffice",
    icon: LayoutDashboard
  },
  {
    title: "Gestión Comercial",
    icon: Users,
    isSection: true,
    items: [
      {
        title: "Clientes",
        href: "/backoffice/clientes",
        icon: Users
      },
      {
        title: "Vehículos",
        href: "/backoffice/vehiculos",
        icon: Car
      },
      {
        title: "Feedback NPS",
        href: "/backoffice/feedback",
        icon: BarChart
      },
      {
        title: "Recordatorios",
        href: "/backoffice/recordatorios",
        icon: Bell
      }
    ]
  },
  {
    title: "Conversaciones",
    icon: MessageSquare,
    isSection: true,
    items: [
      {
        title: "KPIs",
        href: "/backoffice/conversaciones",
        icon: Target
      },
      {
        title: "Lista",
        href: "/backoffice/conversaciones/lista",
        icon: MessageSquare
      },
      {
        title: "Necesita Atención",
        href: "/backoffice/conversaciones/accion-humana",
        icon: AlertTriangle
      }
    ]
  },
  {
    title: "Citas",
    icon: Calendar,
    isSection: true,
    items: [
      {
        title: "Calendario",
        href: "/backoffice/citas/calendario",
        icon: Calendar
      },
      {
        title: "Nueva Cita",
        href: "/backoffice/citas/nueva",
        icon: Calendar
      }
    ]
  },
  {
    title: "Administración",
    icon: Settings,
    isSection: true,
    items: [
      {
        title: "Horarios",
        href: "/backoffice/admin/configuracion",
        icon: Settings
      },
      {
        title: "Fechas Bloqueadas",
        href: "/backoffice/admin/fechas-bloqueadas",
        icon: CalendarX
      },
      {
        title: "Bloqueos por Modelo",
        href: "/backoffice/admin/bloqueos-modelos",
        icon: Car
      },
      {
        title: "Configuración recordatorios",
        href: "/backoffice/admin/recordatorios-automaticos",
        icon: Bell
      },
      {
        title: "Servicios",
        href: "/backoffice/servicios",
        icon: Wrench
      },
      {
        title: "Servicios Específicos",
        href: "/backoffice/servicios-especificos",
        icon: Wrench
      }
    ]
  },
  {
    title: "Analytics",
    icon: TrendingUp,
    isSection: true,
    items: [
      {
        title: "Retención",
        href: "/backoffice/analytics/retencion",
        icon: TrendingUp
      },
      {
        title: "Performance Taller",
        href: "/backoffice/analytics/performance",
        icon: Activity
      },
      {
        title: "Lealtad",
        href: "/backoffice/analytics/lealtad",
        icon: Target
      }
    ]
  },
  {
    title: "Uso de la Plataforma",
    href: "/backoffice/uso",
    icon: BarChart
  },
  {
    title: "Plataforma",
    icon: Building2,
    isSection: true,
    items: [
      {
        title: "Dashboard",
        href: "/backoffice/plataforma",
        icon: LayoutDashboard
      },
      {
        title: "Conversaciones",
        href: "/backoffice/plataforma/conversaciones",
        icon: MessageSquare
      },
      {
        title: "Agencias",
        href: "/backoffice/plataforma/agencias",
        icon: Building2
      },
      {
        title: "Usuarios",
        href: "/backoffice/plataforma/usuarios",
        icon: Users
      }
    ]
  },
];

export function Sidebar() {
  const pathname = usePathname()

  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);

  useEffect(() => {
    // El código dentro de useEffect se ejecuta solo en el lado del cliente
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setSearchParams(params); // Guarda los query params en el estado
    }
  }, []); // Solo se ejecuta una vez, cuando el componente se monta

  const router = useRouter();
  const token : string | null =  searchParams?.get('token') || null;

  const [isCollapsed, setIsCollapsed] = useState(false)
  
  const isSectionActive = (item: MenuItem) => {
    if (!item.items) return false
    return item.items.some(subItem => 
      pathname.startsWith(subItem.href!)
    )
  }

  const [expandedSections, setExpandedSections] = useState<string[]>(() => {
    const activeSections = menuItems
      .filter(item => item.isSection && isSectionActive(item))
      .map(item => item.title)
    return activeSections.length > 0 ? activeSections : []
  })

  useEffect(() => {
    menuItems.forEach(item => {
      if (item.isSection && isSectionActive(item) && !expandedSections.includes(item.title)) {
        setExpandedSections(prev => [...prev, item.title])
      }
    })
  }, [pathname])

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionTitle)
        ? prev.filter(title => title !== sectionTitle)
        : [...prev, sectionTitle]
    )
  }

  if (pathname === "/login/" || pathname === "/register/") {
    return (<div></div>)
  } 

  const queryString = token ? `?token=${token}` : ""

  
  return (
    <div className={cn(
      "h-screen border-r bg-white transition-all duration-300",
      isCollapsed ? "w-[80px]" : "w-[280px]"
    )}>
      <div className="flex h-full flex-col">
        <div className={cn(
          "flex items-center border-b h-[56px]",
          isCollapsed ? "px-4" : "px-6"
        )}>
          <div className={cn(
            "flex items-center gap-2",
            isCollapsed ? "w-full justify-center" : "flex-1"
          )}>
            <div className="p-2">
              <Image
                src="/favicon.ico"
                alt="MuviAI Logo"
                width={24}
                height={24}
                className="rounded-sm"
              />
            </div>
            {!isCollapsed && (
              <h1 className="text-xl font-bold">MuviAI</h1>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <div key={item.title}>
              {!item.isSection ? (
                <Link
                  href={`${item.href!}${queryString}`}
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
                <div className="space-y-1">
                  {!isCollapsed ? (
                    <>
                      <button
                        onClick={() => toggleSection(item.title)}
                        className={cn(
                          "w-full flex items-center justify-between p-4 rounded-lg transition-colors",
                          isSectionActive(item)
                            ? "bg-primary/5 text-primary hover:bg-primary/10"
                            : "hover:bg-gray-100"
                        )}
                      >
                        <div className="flex items-center space-x-3">
                          <item.icon className={cn(
                            "h-6 w-6",
                            isSectionActive(item) ? "text-primary" : "text-gray-500"
                          )} />
                          <span className={cn(
                            "text-sm font-medium",
                            isSectionActive(item) && "text-primary"
                          )}>
                            {item.title}
                          </span>
                        </div>
                        <ChevronRight className={cn(
                          "h-4 w-4 transition-transform",
                          expandedSections.includes(item.title) && "transform rotate-90",
                          isSectionActive(item) ? "text-primary" : "text-gray-500"
                        )} />
                      </button>
                      
                      {expandedSections.includes(item.title) && (
                        <div className="space-y-1">
                          {item.items?.map((subItem) => (
                            <Link
                              key={subItem.href}
                              href={`${subItem.href!}${queryString}`}
                              className={cn(
                                "flex items-center space-x-3 p-4 rounded-lg transition-colors pl-12",
                                pathname === subItem.href
                                  ? "bg-primary/10 text-primary hover:bg-primary/20"
                                  : "hover:bg-gray-100"
                              )}
                            >
                              <subItem.icon className={cn(
                                "h-6 w-6",
                                pathname === subItem.href ? "text-primary" : "text-gray-500"
                              )} />
                              <span className="text-sm font-medium">{subItem.title}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-1">
                      {item.items?.map((subItem) => (
                        <Link
                          key={subItem.href}
                          href={`${subItem.href!}${queryString}`}
                          className={cn(
                            "flex items-center justify-center p-3 rounded-lg transition-colors",
                            pathname === subItem.href
                              ? "bg-primary/10 text-primary hover:bg-primary/20"
                              : "hover:bg-gray-100"
                          )}
                        >
                          <subItem.icon className={cn(
                            "h-6 w-6",
                            pathname === subItem.href ? "text-primary" : "text-gray-500"
                          )} />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className={cn(
          "border-t p-4",
          isCollapsed ? "flex justify-center" : "flex justify-between items-center"
        )}>
          <button
            onClick={() => {
              // Redirigir al login sin token
              router.push("/login");
            }}
            className={cn(
              "p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center gap-2",
              isCollapsed ? "justify-center" : ""
            )}
          >
            <LogOut className="h-5 w-5 text-red-500" />
            {!isCollapsed && <span className="text-sm text-red-500">Cerrar sesión</span>}
          </button>
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
      </div>
  )
  }
