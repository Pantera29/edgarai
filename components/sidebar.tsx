"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
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
  Package,
  Receipt,
  ClipboardList,
  BarChart,
  type LucideIcon
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
      }
    ]
  },
  {
    title: "Operaciones",
    icon: Calendar,
    isSection: true,
    items: [
      {
        title: "Citas",
        href: "/backoffice/citas",
        icon: Calendar
      },
      {
        title: "Transacciones",
        href: "/backoffice/transacciones",
        icon: Receipt
      },
      {
        title: "Servicios Recomendados",
        href: "/backoffice/servicios-recomendados",
        icon: ClipboardList
      }
    ]
  },
  {
    title: "Administración",
    icon: Settings,
    isSection: true,
    items: [
      {
        title: "Configuración",
        href: "/backoffice/admin/configuracion",
        icon: Settings
      },
      {
        title: "Fechas Bloqueadas",
        href: "/backoffice/admin/fechas-bloqueadas",
        icon: CalendarX
      },
      {
        title: "Servicios",
        href: "/backoffice/servicios",
        icon: Wrench
      },
      {
        title: "Productos",
        href: "/backoffice/productos",
        icon: Package
      }
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname()
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
                alt="EdgarAI Logo"
                width={24}
                height={24}
                className="rounded-sm"
              />
            </div>
            {!isCollapsed && (
              <h1 className="text-xl font-bold">EdgarAI</h1>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <div key={item.title}>
              {!item.isSection ? (
                <Link
                  href={item.href!}
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
                              href={subItem.href!}
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
                          href={subItem.href!}
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
          isCollapsed ? "flex justify-center" : "flex justify-end"
        )}>
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
