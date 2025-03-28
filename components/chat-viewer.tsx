"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Avatar } from "@/components/ui/avatar";
import { User, Bot } from "lucide-react";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
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

  return (
    <div 
      ref={chatContainerRef}
      className={cn(
        "flex flex-col gap-4 p-4 overflow-y-auto h-[calc(100vh-200px)]",
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
              message.role === "user" ? "ml-auto" : "mr-auto"
            )}
          >
            {message.role === "assistant" && (
              <Avatar className="h-8 w-8 bg-muted flex items-center justify-center">
                {assistantAvatar}
              </Avatar>
            )}
            <div>
              <div
                className={cn(
                  "rounded-lg p-3",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
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
            {message.role === "user" && (
              <Avatar className="h-8 w-8 bg-primary flex items-center justify-center">
                {userAvatar}
              </Avatar>
            )}
          </div>
        ))
      )}
    </div>
  );
} 