"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";

interface AdminConversationEvaluationDropdownProps {
  conversationId: string;
  currentStatus: 'pending' | 'successful' | 'unsuccessful';
  token: string;
  onStatusChange: (newStatus: 'pending' | 'successful' | 'unsuccessful') => void;
}

export default function AdminConversationEvaluationDropdown({
  conversationId,
  currentStatus,
  token,
  onStatusChange
}: AdminConversationEvaluationDropdownProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [localStatus, setLocalStatus] = useState(currentStatus);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-700 flex items-center gap-1">
            <Clock className="w-4 h-4" /> Sin evaluar
          </Badge>
        );
      case "successful":
        return (
          <Badge className="bg-green-500 text-white flex items-center gap-1">
            <CheckCircle className="w-4 h-4" /> Exitosa
          </Badge>
        );
      case "unsuccessful":
        return (
          <Badge className="bg-red-500 text-white flex items-center gap-1">
            <XCircle className="w-4 h-4" /> No exitosa
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-700 flex items-center gap-1">
            <Clock className="w-4 h-4" /> Sin evaluar
          </Badge>
        );
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === localStatus) return;

    setIsUpdating(true);
    setLocalStatus(newStatus as 'pending' | 'successful' | 'unsuccessful');

    try {
      const response = await fetch(`/api/backoffice/plataforma/evaluations/${conversationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          evaluation_status: newStatus
        })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar evaluación');
      }

      onStatusChange(newStatus as 'pending' | 'successful' | 'unsuccessful');
      console.log('✅ Estado de evaluación actualizado:', newStatus);
    } catch (error) {
      console.error('❌ Error actualizando estado:', error);
      // Revertir cambio local en caso de error
      setLocalStatus(currentStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isUpdating) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Actualizando...</span>
      </div>
    );
  }

  return (
    <Select value={localStatus} onValueChange={handleStatusChange}>
      <SelectTrigger className="w-36 h-8 px-0 border-none bg-transparent shadow-none">
        <SelectValue>{getStatusBadge(localStatus)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pending">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-gray-100 text-gray-700 flex items-center gap-1">
              <Clock className="w-4 h-4" /> Sin evaluar
            </Badge>
          </div>
        </SelectItem>
        <SelectItem value="successful">
          <div className="flex items-center gap-2">
            <Badge className="bg-green-500 text-white flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> Exitosa
            </Badge>
          </div>
        </SelectItem>
        <SelectItem value="unsuccessful">
          <div className="flex items-center gap-2">
            <Badge className="bg-red-500 text-white flex items-center gap-1">
              <XCircle className="w-4 h-4" /> No exitosa
            </Badge>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
} 