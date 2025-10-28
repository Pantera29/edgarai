"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Avatar } from "@/components/ui/avatar";
import { User, Bot, UserCheck, X, ZoomIn } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant" | "customer" | "ai_agent" | "dealership_worker";
  created_at: string;
  sender_user_id?: number;
  sender_name?: string;
  message_type?: string; // ← NUEVO: Tipo de mensaje (text, image, etc.)
  media_url?: string; // ← NUEVO: URL de la imagen o media
  media_metadata?: any; // ← NUEVO: Metadatos del media
}

interface ChatViewerProps {
  messages: Message[];
  userAvatar?: React.ReactNode;
  assistantAvatar?: React.ReactNode;
  className?: string;
  scrollAreaRef?: React.RefObject<HTMLDivElement | null>;
  shouldAutoScroll?: boolean; // Nuevo prop para controlar auto-scroll
}

export function ChatViewer({
  messages,
  userAvatar = <User className="h-6 w-6 text-white" />,
  assistantAvatar = <Bot className="h-6 w-6 text-primary" />,
  className,
  scrollAreaRef,
  shouldAutoScroll = true, // Por defecto, permitir auto-scroll
}: ChatViewerProps) {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Usar el ref externo si se proporciona, sino usar el interno
  const actualScrollRef = scrollAreaRef || chatContainerRef;
  
  // Estado para el modal de imagen
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    caption?: string;
    metadata?: any;
  } | null>(null);

  // Depuración
  useEffect(() => {
    console.log("ChatViewer recibió mensajes:", messages);
  }, [messages]);

  // Debug: verificar si el ref se está asignando correctamente
  useEffect(() => {
    if (actualScrollRef.current) {
      console.log("✅ [ChatViewer] Ref asignado correctamente al elemento:", actualScrollRef.current);
    } else {
      console.log("❌ [ChatViewer] Ref no está asignado aún");
    }
  }, [actualScrollRef]);

  // Función para hacer scroll al final
  const scrollToBottom = () => {
    if (actualScrollRef.current) {
      actualScrollRef.current.scrollTo({
        top: actualScrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Exponer la función de scroll al componente padre
  useEffect(() => {
    // Crear una función global que el padre pueda llamar
    (window as any).scrollChatToBottom = scrollToBottom;
  }, []);

  // Scroll automático al final cuando se cargan mensajes (solo si shouldAutoScroll es true)
  useEffect(() => {
    if (shouldAutoScroll && actualScrollRef.current) {
      console.log('🔄 [ChatViewer] Haciendo scroll automático al final');
      actualScrollRef.current.scrollTop = actualScrollRef.current.scrollHeight;
    } else if (!shouldAutoScroll) {
      console.log('⏭️ [ChatViewer] Saltando scroll automático (shouldAutoScroll=false)');
    }
  }, [messages, shouldAutoScroll]);

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

  // Función para manejar el click en una imagen
  const handleImageClick = (url: string, caption?: string, metadata?: any) => {
    setSelectedImage({ url, caption, metadata });
  };

  // Función para limpiar URLs mal formadas
  const cleanUrl = (url: string) => {
    if (!url) return url;
    // Remover comillas dobles al inicio y final
    return url.replace(/^"/, '').replace(/"$/, '');
  };

  // Función para formatear tamaño de archivo de manera legible
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Función para renderizar el contenido del mensaje (texto o imagen)
  const renderMessageContent = (message: Message) => {
    // Si es un mensaje de imagen, mostrar la imagen
    if (message.message_type === 'image' && message.media_url) {
      const cleanMediaUrl = cleanUrl(message.media_url);
      
      return (
        <div className="space-y-2">
          {/* Imagen clickeable */}
          <div 
            className="relative max-w-xs group cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleImageClick(cleanMediaUrl, message.content, message.media_metadata);
            }}
          >
            <img
              src={cleanMediaUrl}
              alt="Imagen enviada"
              className="rounded-lg shadow-sm border max-w-full h-auto hover:opacity-90 transition-opacity"
              onError={(e) => {
                console.warn('Error cargando imagen, mostrando fallback:', cleanMediaUrl);
                // En lugar de ocultar la imagen, mostrar un fallback
                const target = e.currentTarget;
                target.style.display = 'none';
                
                // Crear elemento de fallback con tamaño limitado
                const fallback = document.createElement('div');
                fallback.className = 'bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-2 text-center text-gray-500 text-xs max-h-16 flex items-center justify-center';
                fallback.innerHTML = `
                  <div class="flex flex-col items-center space-y-1">
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <span class="text-xs">Imagen no disponible</span>
                  </div>
                `;
                
                // Insertar fallback después de la imagen
                target.parentNode?.insertBefore(fallback, target.nextSibling);
              }}
            />
            {/* Icono de zoom que aparece al hacer hover */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
              <ZoomIn className="h-6 w-6 text-white" />
            </div>
          </div>
          
          {/* Caption si existe */}
          {message.content && message.content.trim() && (
            <p className="text-sm whitespace-pre-wrap break-words">
              {formatMessageContent(message.content)}
            </p>
          )}
          
          {/* Metadatos de la imagen si están disponibles */}
          {message.media_metadata && (
            <div className="text-xs text-muted-foreground">
              {message.media_metadata.dimensions && (
                <p>
                  <span className="font-medium">Dimensiones:</span>{' '}
                  {typeof message.media_metadata.dimensions === 'object' 
                    ? `${message.media_metadata.dimensions.width} x ${message.media_metadata.dimensions.height}px`
                    : message.media_metadata.dimensions}
                </p>
              )}
              {message.media_metadata.compressed_size && (
                <p>
                  <span className="font-medium">Tamaño:</span>{' '}
                  {message.media_metadata.compressed_size}
                </p>
              )}
            </div>
          )}
        </div>
      );
    }
    
    // Si es un mensaje de audio, mostrar transcript + reproductor
    if (message.message_type === 'audio' && message.media_url) {
      const cleanMediaUrl = cleanUrl(message.media_url);
      
      return (
        <div className="space-y-2">
          {/* Transcript del audio (siempre visible) */}
          {message.content && message.content.trim() && (
            <p className="text-sm whitespace-pre-wrap break-words">
              {formatMessageContent(message.content)}
            </p>
          )}
          
          {/* Reproductor de audio (siempre visible) */}
          <div>
            <audio 
              src={cleanMediaUrl} 
              controls 
              className="w-full max-w-md"
              onError={(e) => {
                console.error('Error cargando audio:', cleanMediaUrl, e);
              }}
            />
          </div>
          
          {/* Metadatos si están disponibles */}
          {message.media_metadata && message.media_metadata.byte_size && (
            <div className="text-xs text-muted-foreground">
              <span>Tamaño: {formatFileSize(message.media_metadata.byte_size)}</span>
            </div>
          )}
        </div>
      );
    }
    
    // Si es un mensaje de texto normal
    return (
      <p className="text-sm whitespace-pre-wrap break-words">
        {formatMessageContent(message.content)}
      </p>
    );
  };

  // Función para determinar si es un mensaje del cliente/usuario
  const isUserMessage = (role: string) => {
    return role === "user" || role === "customer";
  };

  // Función para determinar si es un mensaje del asistente/sistema
  const isAssistantMessage = (role: string) => {
    return role === "assistant" || role === "ai_agent" || role === "dealership_worker";
  };

  // Función para obtener la etiqueta del remitente
  const getSenderLabel = (message: any) => {
    const role = message.role;
    
    switch (role) {
      case "ai_agent":
        return "Enviado por Agente IA";
      case "dealership_worker":
        // Si tenemos el nombre del usuario, mostrarlo; si no, usar el label genérico
        const senderName = message.sender_name;
        if (senderName && senderName.trim() !== '' && senderName !== 'null' && senderName !== 'undefined') {
          return `Enviado por ${senderName}`;
        } else {
          return "Enviado por Asesor";
        }
      case "assistant":
        return "Enviado por Asistente";
      default:
        return null; // No mostrar etiqueta para mensajes del cliente
    }
  };

  // Función para obtener el color de la etiqueta según el rol
  const getLabelColor = (message: any) => {
    const role = message.role;
    
    switch (role) {
      case "ai_agent":
        return "text-blue-600"; // Azul para Agente IA
      case "dealership_worker":
        return "text-green-600"; // Verde para Asesor
      case "assistant":
        return "text-blue-600"; // Azul para Asistente genérico
      default:
        return "text-gray-600";
    }
  };

  // Función para obtener el estilo del mensaje según el rol
  const getMessageStyle = (message: any) => {
    const role = message.role;
    
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
      ref={actualScrollRef}
      className={cn(
        "flex flex-col gap-4 p-4 overflow-y-auto h-full max-h-full min-h-0 chat-scrollbar",
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
        messages.map((message, index) => {
          const senderLabel = getSenderLabel(message);
          const isAssistant = isAssistantMessage(message.role);
          const isUser = isUserMessage(message.role);
          
          return (
            <div
              key={`${message.id}-${index}`}
              className={cn(
                "flex gap-3 w-80", // Ancho fijo de 320px (w-80)
                isAssistant ? "ml-auto" : "mr-auto" // Invertir la lógica: asistentes a la derecha, usuarios a la izquierda
              )}
            >
              {/* Avatar del cliente (solo si es mensaje del cliente) */}
              {isUser && (
                <Avatar className={cn("h-8 w-8 flex items-center justify-center", getAvatarColor(message.role))}>
                  {getAvatar(message.role)}
                </Avatar>
              )}
              
              <div className="flex-1">
                {/* Etiqueta del remitente */}
                {senderLabel && (
                  <div className="mb-1">
                    <p className={cn("text-xs font-medium", getLabelColor(message))}>
                      {senderLabel}
                    </p>
                  </div>
                )}
                
                {/* Burbuja del mensaje */}
                <div
                  className={cn(
                    "rounded-lg p-3",
                    getMessageStyle(message)
                  )}
                >
                  {renderMessageContent(message)}
                </div>
                
                {/* Timestamp */}
                <p className="text-xs text-muted-foreground mt-1">
                  {formatMessageDate(message.created_at)}
                </p>
              </div>
              
              {/* Avatar del asistente (solo si es mensaje del asistente) */}
              {isAssistant && (
                <Avatar className={cn("h-8 w-8 flex items-center justify-center", getAvatarColor(message.role))}>
                  {getAvatar(message.role)}
                </Avatar>
              )}
            </div>
          );
        })
      )}
      
      {/* Modal para ver imagen en tamaño completo */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full mx-4 relative">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Imagen</h3>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Contenido */}
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {/* Imagen */}
              <div className="flex justify-center">
                <img
                  src={cleanUrl(selectedImage.url)}
                  alt="Imagen ampliada"
                  className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg"
                  onError={(e) => {
                    console.warn('Error cargando imagen ampliada, mostrando fallback:', cleanUrl(selectedImage.url));
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    
                    // Crear elemento de fallback para el modal con tamaño limitado
                    const fallback = document.createElement('div');
                    fallback.className = 'bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500 max-h-32 flex items-center justify-center';
                    fallback.innerHTML = `
                      <div class="flex flex-col items-center space-y-2">
                        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        <div>
                          <p class="text-sm font-medium">Imagen no disponible</p>
                          <p class="text-xs text-gray-400">URL no accesible</p>
                        </div>
                      </div>
                    `;
                    
                    // Insertar fallback en el modal
                    target.parentNode?.insertBefore(fallback, target.nextSibling);
                  }}
                />
              </div>
              
              {/* Caption si existe */}
              {selectedImage.caption && selectedImage.caption.trim() && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                    {selectedImage.caption}
                  </p>
                </div>
              )}
              
              {/* Metadatos de la imagen si están disponibles */}
              {selectedImage.metadata && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Información de la imagen</h4>
                  <div className="text-xs text-gray-600 space-y-1">
                    {selectedImage.metadata.dimensions && (
                      <p>
                        <span className="font-medium">Dimensiones:</span>{' '}
                        {typeof selectedImage.metadata.dimensions === 'object' 
                          ? `${selectedImage.metadata.dimensions.width} x ${selectedImage.metadata.dimensions.height}px`
                          : selectedImage.metadata.dimensions}
                      </p>
                    )}
                    {selectedImage.metadata.compressed_size && (
                      <p>
                        <span className="font-medium">Tamaño:</span>{' '}
                        {selectedImage.metadata.compressed_size}
                      </p>
                    )}
                    {selectedImage.metadata.original_size && (
                      <p>
                        <span className="font-medium">Tamaño original:</span>{' '}
                        {selectedImage.metadata.original_size}
                      </p>
                    )}
                    {selectedImage.metadata.compression_ratio && (
                      <p>
                        <span className="font-medium">Compresión:</span>{' '}
                        {selectedImage.metadata.compression_ratio}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 