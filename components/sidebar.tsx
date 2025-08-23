"use client"

import { useState, useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation" // Importa useSearchParams
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useAgencyInfo } from "@/hooks/useAgencyInfo"
import { useUserInfo } from "@/hooks/useUserInfo"
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
  Activity,
  UserCheck,
  BarChart3,
  List,
  CalendarDays,
  CalendarPlus,
  Clock,
  Cog,
  Settings2
} from "lucide-react"

interface SubMenuItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

interface MenuItem {
  title: string;
  href?: string;
  icon: LucideIcon;
  items?: SubMenuItem[];
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
        icon: UserCheck
      },
      {
        title: "Vehículos",
        href: "/backoffice/vehiculos",
        icon: Car
      },
      {
        title: "Feedback NPS",
        href: "/backoffice/feedback",
        icon: BarChart3
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
        icon: List
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
        icon: CalendarDays
      },
      {
        title: "Nueva Cita",
        href: "/backoffice/citas/nueva",
        icon: CalendarPlus
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
        icon: Clock
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
        icon: Cog
      }
    ]
  },
  // {
  //   title: "Analytics",
  //   icon: TrendingUp,
  //   isSection: true,
  //   items: [
  //     {
  //       title: "Retención",
  //       href: "/backoffice/analytics/retencion",
  //       icon: TrendingUp
  //     },
  //     {
  //       title: "Performance Taller",
  //       href: "/backoffice/analytics/performance",
  //       icon: Activity
  //     },
  //     {
  //       title: "Lealtad",
  //       href: "/backoffice/analytics/lealtad",
  //       icon: Target
  //     }
  //   ]
  // },
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
  const { name: agencyName, loading: agencyLoading } = useAgencyInfo()
  const { names: userName, surnames: userSurnames, email: userEmail, loading: userLoading } = useUserInfo()

  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);

  // Debug: Log current pathname
  console.log('🔍 Sidebar - Current pathname:', pathname);

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
  const [wasManuallyCollapsed, setWasManuallyCollapsed] = useState<boolean | null>(null)
  
  const isActive = (href: string) => {
    // Para el dashboard, usar comparación exacta (con y sin barra final)
    if (href === '/backoffice') {
      const result = pathname === href || pathname === href + '/'
      console.log(`🔍 isActive check (dashboard): pathname="${pathname}" href="${href}" result=${result}`)
      return result
    }
    
    // Para otros elementos, usar startsWith
    const result = pathname === href || pathname.startsWith(href + '/')
    console.log(`🔍 isActive check: pathname="${pathname}" href="${href}" result=${result}`)
    return result
  }

  const hasActiveChild = (item: MenuItem) => {
    if (!item.items) return false
    return item.items.some(subItem => isActive(subItem.href))
  }

  const [expandedSections, setExpandedSections] = useState<string[]>(() => {
    const activeSections = menuItems
      .filter(item => item.isSection && hasActiveChild(item))
      .map(item => item.title)
    return activeSections.length > 0 ? activeSections : []
  })

  useEffect(() => {
    menuItems.forEach(item => {
      if (item.isSection && hasActiveChild(item) && !expandedSections.includes(item.title)) {
        setExpandedSections(prev => [...prev, item.title])
      }
    })
  }, [pathname])

  // Auto-colapsar cuando entramos a páginas específicas
  useEffect(() => {
    const shouldAutoCollapse = pathname.startsWith("/backoffice/conversaciones/accion-humana")
    console.log('🔄 Sidebar - pathname:', pathname, 'shouldAutoCollapse:', shouldAutoCollapse)
    
    if (shouldAutoCollapse) {
      // Si estamos entrando a la página de acción humana
      console.log('✅ Sidebar - Colapsando automáticamente')
      setWasManuallyCollapsed(isCollapsed) // Recordar el estado anterior
      setIsCollapsed(true)
    } else if (wasManuallyCollapsed !== null) {
      // Si estamos saliendo de la página de acción humana
      console.log('🔄 Sidebar - Restaurando estado original:', wasManuallyCollapsed)
      setIsCollapsed(wasManuallyCollapsed)
      setWasManuallyCollapsed(null) // Resetear el estado
    }
  }, [pathname, isCollapsed, wasManuallyCollapsed])

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
    <TooltipProvider>
      <div className={cn(
        "h-screen border-r bg-white transition-all duration-300",
        isCollapsed ? "w-[80px]" : "w-[280px]"
      )}>
              <div className="flex h-full flex-col">
        <div className={cn(
          "flex items-center justify-between border-b h-[56px]",
          isCollapsed ? "px-4" : "px-6"
        )}>
          <div className={cn(
            "flex items-center gap-2",
            isCollapsed ? "w-full justify-center" : "flex-1"
          )}>
            {!isCollapsed ? (
              <div className="flex flex-col">
                <h1 className="text-xl font-bold">MuviAI</h1>
                {!agencyLoading && agencyName && (
                  <p className="text-xs text-gray-500 truncate">{agencyName}</p>
                )}
              </div>
            ) : (
              agencyName && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-center">
                      <h1 className="text-lg font-bold">M</h1>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <div className="text-center">
                      <p className="font-bold">MuviAI</p>
                      <p className="text-xs text-gray-400">{agencyName}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              )
            )}
          </div>
          
          <button
            onClick={() => {
              if (!pathname.startsWith("/backoffice/conversaciones/accion-humana")) {
                setIsCollapsed(!isCollapsed)
              }
            }}
            disabled={pathname.startsWith("/backoffice/conversaciones/accion-humana")}
            className={cn(
              "p-2 hover:bg-gray-100 rounded-full transition-colors",
              pathname.startsWith("/backoffice/conversaciones/accion-humana") && "opacity-50 cursor-not-allowed"
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Información del usuario */}
        {!isCollapsed && !userLoading && (userName || userEmail) && (
          <div className="px-6 py-3 border-b">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {(userName?.charAt(0) || userEmail?.charAt(0) || 'U').toUpperCase()}
                </span>
              </div>
              <div className="flex flex-col">
                {userName && userSurnames && (
                  <p className="text-sm font-medium text-gray-900">
                    {userName} {userSurnames}
                  </p>
                )}
                <p className="text-xs text-gray-500 truncate">
                  {userEmail}
                </p>
              </div>
            </div>
          </div>
        )}
  
          <nav className="flex-1 p-2.5 space-y-2">
          {menuItems.map((item) => (
            <div key={item.title}>
              {!item.isSection ? (
                isCollapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={`${item.href!}${queryString}`}
                        className={cn(
                          "flex items-center justify-center p-2 rounded-lg transition-colors hover:bg-blue-100",
                          isActive(item.href!)
                            ? "bg-primary/10 text-primary hover:bg-primary/20"
                            : "hover:bg-blue-100"
                        )}
                      >
                        <item.icon className={cn(
                          "h-6 w-6",
                          isActive(item.href!) ? "text-primary" : "text-gray-500 hover:text-blue-600"
                        )} />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{item.title}</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Link
                    href={`${item.href!}${queryString}`}
                    className={cn(
                      "flex items-center space-x-3 p-2.5 rounded-lg transition-colors",
                      isActive(item.href!)
                        ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                        : "hover:bg-gray-100"
                    )}
                  >
                                            <item.icon className={cn(
                          "h-6 w-6",
                          isActive(item.href!) ? "text-blue-600" : "text-gray-500"
                        )} />
                    <span className="text-sm font-medium">{item.title}</span>
                  </Link>
                )
              ) : (
                <div className="space-y-1">
                  {!isCollapsed ? (
                    <>
                      <button
                        onClick={() => toggleSection(item.title)}
                        className={cn(
                          "w-full flex items-center justify-between p-2.5 rounded-lg transition-colors",
                          hasActiveChild(item)
                            ? "bg-primary/5 text-primary hover:bg-primary/10"
                            : "hover:bg-gray-100"
                        )}
                      >
                        <div className="flex items-center space-x-3">
                          <item.icon className={cn(
                            "h-6 w-6",
                            hasActiveChild(item) ? "text-primary" : "text-gray-500"
                          )} />
                          <span className={cn(
                            "text-sm font-medium",
                            hasActiveChild(item) && "text-primary"
                          )}>
                            {item.title}
                          </span>
                        </div>
                        <ChevronRight className={cn(
                          "h-4 w-4 transition-transform",
                          expandedSections.includes(item.title) && "transform rotate-90",
                          hasActiveChild(item) ? "text-primary" : "text-gray-500"
                        )} />
                      </button>
                      
                      {expandedSections.includes(item.title) && (
                        <div className="space-y-1">
                          {item.items?.map((subItem) => (
                            <Link
                              key={subItem.href}
                              href={`${subItem.href!}${queryString}`}
                              className={cn(
                                "flex items-center space-x-3 p-2.5 rounded-lg transition-colors pl-12",
                                isActive(subItem.href)
                                  ? "bg-primary/10 text-primary hover:bg-primary/20"
                                  : "hover:bg-gray-100"
                              )}
                            >
                              <subItem.icon className={cn(
                                "h-6 w-6",
                                isActive(subItem.href) ? "text-primary" : "text-gray-500"
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
                        <Tooltip key={subItem.href}>
                          <TooltipTrigger asChild>
                            <Link
                              href={`${subItem.href!}${queryString}`}
                              className={cn(
                                "flex items-center justify-center p-2 rounded-lg transition-colors hover:bg-blue-100",
                                isActive(subItem.href)
                                  ? "bg-primary/10 text-primary hover:bg-primary/20"
                                  : "hover:bg-blue-100"
                              )}
                            >
                              <subItem.icon className={cn(
                                "h-6 w-6",
                                isActive(subItem.href) ? "text-primary" : "text-gray-500 hover:text-blue-600"
                              )} />
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>{subItem.title}</p>
                          </TooltipContent>
                        </Tooltip>
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
          isCollapsed ? "flex justify-center" : "flex justify-start items-center"
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
        </div>
      </div>
      </div>
      </TooltipProvider>
  )
  }
