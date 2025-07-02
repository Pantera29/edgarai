"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MessageSquare, Loader2 } from "lucide-react";

interface AdminConversationCommentsModalProps {
  conversationId: string;
  currentComments: string | null;
  token: string;
  onCommentsChange: (newComments: string | null) => void;
}

export default function AdminConversationCommentsModal({
  conversationId,
  currentComments,
  token,
  onCommentsChange
}: AdminConversationCommentsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [comments, setComments] = useState(currentComments || "");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/backoffice/plataforma/evaluations/${conversationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          admin_comments: comments.trim() || null
        })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar comentarios');
      }

      onCommentsChange(comments.trim() || null);
      setIsOpen(false);
      console.log('✅ Comentarios actualizados');
    } catch (error) {
      console.error('❌ Error actualizando comentarios:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setComments(currentComments || "");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <MessageSquare className="h-3 w-3 mr-1" />
          Comentarios
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Comentarios de Evaluación</DialogTitle>
          <DialogDescription>
            Agrega comentarios o notas sobre esta conversación para el equipo administrativo.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder="Escribe tus comentarios aquí..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="min-h-[120px]"
            disabled={isUpdating}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isUpdating}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 