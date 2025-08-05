"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Package, Receipt } from "lucide-react"
import { Home, Calendar, Users } from "lucide-react"

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string
    title: string
  }[]
}

export function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <nav className="flex space-y-1">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            pathname === item.href
              ? "bg-muted hover:bg-muted"
              : "hover:bg-transparent hover:underline",
            "justify-start w-full"
          )}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  )
}

export const sidebarLinks = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
    description: "Vista general del sistema"
  },
  {
    title: "Citas",
    href: "/backoffice/citas/calendario",
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
    title: "Productos",
    href: "/productos",
    icon: Package,
    description: "Gestión de inventario y productos"
  }
] 