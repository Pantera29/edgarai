import { Home, Users, Calendar, Settings, MessageSquare, Car, Wrench } from "lucide-react"

export const navigationItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: Home,
  },
  {
    title: "Clientes",
    href: "/clientes",
    icon: Users,
  },
  {
    title: "Citas",
    href: "/citas",
    icon: Calendar,
  },
  {
    title: "Servicios",
    href: "/servicios",
    icon: Settings,
  },
  {
    title: "Servicios Específicos",
    href: "/servicios-especificos",
    icon: Wrench,
  },
  {
    title: "Vehículos",
    href: "/vehiculos",
    icon: Car,
  },
  {
    title: "Conversaciones",
    href: "/conversaciones",
    icon: MessageSquare,
  },
] 