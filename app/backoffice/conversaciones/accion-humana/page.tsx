"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { verifyToken } from "../../../jwt/token";
import { WhatsAppStyleLayout } from "@/components/whatsapp-layout/WhatsAppStyleLayout";
import { ConversationList } from "@/components/whatsapp-layout/ConversationList";
import { ChatPanel } from "@/components/whatsapp-layout/ChatPanel";
import { useSelectedConversation } from "@/hooks/useSelectedConversation";

export default function ConversacionesAccionHumanaPage() {
  const router = useRouter();
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  const [token, setToken] = useState<string>("");
  const [dataToken, setDataToken] = useState<any>(null);
  
  // Estado compartido para la conversación seleccionada
  const { selectedConversationId, selectConversation } = useSelectedConversation();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setSearchParams(params);
    }
  }, []);

  useEffect(() => {
    if (searchParams) {
      const tokenValue = searchParams.get("token");
      if (tokenValue) {
        setToken(tokenValue);
        const verifiedDataToken = verifyToken(tokenValue);
        
        if (
          !verifiedDataToken ||
          typeof verifiedDataToken !== "object" ||
          Object.keys(verifiedDataToken).length === 0 ||
          !(verifiedDataToken as any).dealership_id
        ) {
          router.push("/login");
          return;
        }
        
        setDataToken(verifiedDataToken || {});
      }
    }
  }, [searchParams, router]);

  const handleNavigateToClient = (clientId: string) => {
    router.push(`/backoffice/clientes/${clientId}?token=${token}`);
  };

  // No renderizar nada hasta que tengamos el token verificado
  if (!dataToken) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Verificando acceso...</p>
      </div>
    );
  }

  return (
    <WhatsAppStyleLayout
      conversationList={
        <ConversationList
          dataToken={dataToken}
          onConversationSelect={selectConversation}
          selectedConversationId={selectedConversationId}
        />
      }
      chatPanel={
        <ChatPanel
          conversationId={selectedConversationId}
          dataToken={dataToken}
          onNavigateToClient={handleNavigateToClient}
        />
      }
    />
  );
}