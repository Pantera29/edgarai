"use client";

import { MessageSquare, ArrowLeft } from "lucide-react";

export function ChatPlaceholder() {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center space-y-4 max-w-md">
        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
          <MessageSquare className="h-12 w-12 text-gray-400" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-800">
            Selecciona una conversación
          </h2>
          <p className="text-gray-600 text-sm">
            Elige una conversación de la lista para ver los mensajes y comenzar a atender al cliente
          </p>
        </div>
        
        <div className="flex items-center justify-center text-sm text-gray-500">
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span>Haz clic en cualquier conversación para comenzar</span>
        </div>
      </div>
    </div>
  );
}
