"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Plus, Loader2 } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface AdminConversationTagsInputProps {
  conversationId: string;
  currentTags: string[];
  token: string;
  onTagsChange: (newTags: string[]) => void;
}

export default function AdminConversationTagsInput({
  conversationId,
  currentTags,
  token,
  onTagsChange
}: AdminConversationTagsInputProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [localTags, setLocalTags] = useState<string[]>(currentTags);
  const [newTag, setNewTag] = useState("");
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [open, setOpen] = useState(false);

  // Cargar tags disponibles
  useEffect(() => {
    const loadAvailableTags = async () => {
      setIsLoadingTags(true);
      try {
        const response = await fetch('/api/backoffice/plataforma/evaluations/tags', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setAvailableTags(data.tags || []);
        }
      } catch (error) {
        console.error('Error cargando tags disponibles:', error);
      } finally {
        setIsLoadingTags(false);
      }
    };

    loadAvailableTags();
  }, [token]);

  const handleAddTag = async (tag: string) => {
    if (!tag.trim() || localTags.includes(tag.trim())) return;

    const newTags = [...localTags, tag.trim()];
    setLocalTags(newTags);
    setNewTag("");
    setOpen(false);

    await updateTags(newTags);
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const newTags = localTags.filter(tag => tag !== tagToRemove);
    setLocalTags(newTags);
    await updateTags(newTags);
  };

  const updateTags = async (tags: string[]) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/backoffice/plataforma/evaluations/${conversationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          evaluation_tags: tags
        })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar tags');
      }

      onTagsChange(tags);
      console.log('✅ Tags actualizados:', tags);
    } catch (error) {
      console.error('❌ Error actualizando tags:', error);
      // Revertir cambio local en caso de error
      setLocalTags(currentTags);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredAvailableTags = availableTags.filter(tag => 
    !localTags.includes(tag) && 
    tag.toLowerCase().includes(newTag.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {localTags.map((tag) => (
          <Badge key={tag} variant="secondary" className="flex items-center gap-1">
            {tag}
            <button
              onClick={() => handleRemoveTag(tag)}
              className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
              disabled={isUpdating}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {isUpdating && (
          <div className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="text-xs text-muted-foreground">Guardando...</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Plus className="h-3 w-3 mr-1" />
              Agregar tag
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <Command>
              <CommandInput 
                placeholder="Buscar o crear tag..." 
                value={newTag}
                onValueChange={setNewTag}
              />
              <CommandList>
                <CommandEmpty>
                  {newTag.trim() && (
                    <CommandItem
                      onSelect={() => handleAddTag(newTag)}
                      className="text-blue-600"
                    >
                      <Plus className="h-3 w-3 mr-2" />
                      Crear "{newTag}"
                    </CommandItem>
                  )}
                </CommandEmpty>
                <CommandGroup>
                  {isLoadingTags ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="ml-2 text-sm">Cargando tags...</span>
                    </div>
                  ) : (
                    filteredAvailableTags.map((tag) => (
                      <CommandItem
                        key={tag}
                        onSelect={() => handleAddTag(tag)}
                      >
                        {tag}
                      </CommandItem>
                    ))
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
} 