"use client";

import { useState } from "react";

interface WhatsAppStyleLayoutProps {
  conversationList: React.ReactNode;
  chatPanel: React.ReactNode;
}

export function WhatsAppStyleLayout({ conversationList, chatPanel }: WhatsAppStyleLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Lista de Conversaciones - Columna Izquierda */}
      <div className="w-[400px] border-r border-gray-200 bg-white flex-shrink-0">
        {conversationList}
      </div>

      {/* Chat Panel - Columna Derecha */}
      <div className="flex-1 bg-white">
        {chatPanel}
      </div>
    </div>
  );
}
