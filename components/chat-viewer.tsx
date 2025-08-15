"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Avatar } from "@/components/ui/avatar";
import { User, Bot, UserCheck } from "lucide-react";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant" | "customer" | "ai_agent" | "dealership_worker";
  created_at: string;
}

interface ChatViewerProps {
  messages: Message[];
  userAvatar?: React.ReactNode;
  assistantAvatar?: React.ReactNode;
  className?: string;
}

export function ChatViewer({
  messages,
  userAvatar = <User className="h-6 w-6 text-white" />,
  assistantAvatar = <Bot className="h-6 w-6 text-primary" />,
  className,
}: ChatViewerProps) {
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Depuración
  useEffect(() => {
    console.log("ChatViewer recibió mensajes:", messages);
  }, [messages]);

  // Scroll automático al final cuando se cargan mensajes
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const formatMessageDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM, HH:mm", { locale: es });
    } catch (error) {
      return "Fecha inválida";
    }
  };

  const formatMessageContent = (content: string) => {
    // Asegurar que el contenido sea string
    if (typeof content !== 'string') {
      // Si content no es string, intentar convertirlo
      try {
        if (content === null || content === undefined) {
          return "[Contenido vacío]";
        }
        if (typeof content === 'object') {
          return JSON.stringify(content);
        }
        content = String(content);
      } catch (error) {
        console.error("Error al formatear contenido:", error);
        return "[Error al mostrar contenido]";
      }
    }
    
    // Dividir por saltos de línea y renderizar
    return content.split("\n").map((line, i) => (
      <span key={i}>
        {line}
        {i < content.split("\n").length - 1 && <br />}
      </span>
    ));
  };

  // Función para determinar si es un mensaje del cliente/usuario
  const isUserMessage = (role: string) => {
    return role === "user" || role === "customer";
  };

  // Función para determinar si es un mensaje del asistente/sistema
  const isAssistantMessage = (role: string) => {
    return role === "assistant" || role === "ai_agent" || role === "dealership_worker";
  };

  // Función para obtener el estilo del mensaje según el rol
  const getMessageStyle = (role: string) => {
    switch (role) {
      case "customer":
      case "user":
        return "bg-gray-100 text-gray-800 border border-gray-200"; // Cliente - Gris con borde
      case "ai_agent":
        return "bg-blue-600 text-white"; // AI Agent - Azul
      case "dealership_worker":
        return "bg-green-600 text-white"; // Dealership Worker - Verde
      case "assistant":
      default:
        return "bg-blue-600 text-white"; // Assistant genérico - Azul (fallback)
    }
  };

  // Función para obtener el avatar según el rol
  const getAvatar = (role: string) => {
    switch (role) {
      case "customer":
      case "user":
        return <User className="h-6 w-6 text-white" />;
      case "ai_agent":
        return <Bot className="h-6 w-6 text-white" />;
      case "dealership_worker":
        return <UserCheck className="h-6 w-6 text-white" />;
      case "assistant":
      default:
        return <Bot className="h-6 w-6 text-white" />;
    }
  };

  // Función para obtener el color del avatar según el rol
  const getAvatarColor = (role: string) => {
    switch (role) {
      case "customer":
      case "user":
        return "bg-gray-400"; // Gris para cliente
      case "ai_agent":
        return "bg-blue-500"; // Azul para AI
      case "dealership_worker":
        return "bg-green-500"; // Verde para agente humano
      case "assistant":
      default:
        return "bg-blue-500"; // Azul para assistant genérico
    }
  };

  return (
    <div 
      ref={chatContainerRef}
      className={cn(
        "flex flex-col gap-4 p-4 overflow-y-auto h-full",
        className
      )}
    >
      {messages.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <p className="text-muted-foreground text-center">
            No hay mensajes en esta conversación
          </p>
        </div>
      ) : (
        messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3 max-w-[80%]",
              isUserMessage(message.role) ? "ml-auto" : "mr-auto"
            )}
          >
            {isAssistantMessage(message.role) && (
              <Avatar className={cn("h-8 w-8 flex items-center justify-center", getAvatarColor(message.role))}>
                {getAvatar(message.role)}
              </Avatar>
            )}
            <div>
              <div
                className={cn(
                  "rounded-lg p-3",
                  getMessageStyle(message.role)
                )}
              >
                <p className="text-sm whitespace-pre-wrap break-words">
                  {formatMessageContent(message.content)}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatMessageDate(message.created_at)}
              </p>
            </div>
            {isUserMessage(message.role) && (
              <Avatar className={cn("h-8 w-8 flex items-center justify-center", getAvatarColor(message.role))}>
                {getAvatar(message.role)}
              </Avatar>
            )}
          </div>
        ))
      )}
    </div>
  );
} 