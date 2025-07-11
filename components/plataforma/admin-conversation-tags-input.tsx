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
  availableTags: string[];
  onTagsChange: (newTags: string[]) => void;
}

// Normalizar siempre a array de strings
function normalizeTags(tags: any): string[] {
  if (!Array.isArray(tags)) return [];
  return tags.filter((t) => typeof t === "string");
}

export default function AdminConversationTagsInput({
  conversationId,
  currentTags,
  token,
  availableTags,
  onTagsChange
}: AdminConversationTagsInputProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [localTags, setLocalTags] = useState<string[]>(normalizeTags(currentTags));
  const [newTag, setNewTag] = useState("");
  const [open, setOpen] = useState(false);

  // Actualizar tags locales cuando cambien los props
  useEffect(() => {
    setLocalTags(normalizeTags(currentTags));
  }, [currentTags]);

  // LOGS para depuración
  console.log("localTags:", localTags);
  console.log("availableTags:", availableTags);
  console.log("currentTags:", currentTags);

  const filteredAvailableTags = availableTags
    .filter((tag) => typeof tag === "string" && tag.trim() !== "" && !localTags.includes(tag))
    .filter((tag) => tag.toLowerCase().includes(newTag.toLowerCase()));

  console.log("filteredAvailableTags:", filteredAvailableTags);

  const handleAddTag = async (tag: string) => {
    if (typeof tag !== "string" || !tag.trim() || localTags.includes(tag.trim())) return;

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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al actualizar tags');
      }

      onTagsChange(tags);
      console.log('✅ Tags actualizados:', tags);
    } catch (error) {
      console.error('❌ Error actualizando tags:', error);
      // Revertir cambio local en caso de error
      const normalizedCurrentTags = Array.isArray(currentTags) ? currentTags : [];
      setLocalTags(normalizedCurrentTags);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {localTags.filter((tag) => typeof tag === "string" && tag.trim() !== "").map((tag) => (
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
                onValueChange={(val) => {
                  if (typeof val === "string") {
                    setNewTag(val);
                  } else {
                    console.error('❌ Valor no string recibido en CommandInput.onValueChange:', val);
                  }
                }}
              />
              <CommandList>
                {(() => {
                  const validTags = filteredAvailableTags.filter(
                    (tag) => typeof tag === "string" && tag.trim() !== ""
                  );
                  if (validTags.length === 0 && newTag.trim() !== "") {
                    // Workaround: div clickable
                    return (
                      <div
                        onClick={() => handleAddTag(newTag.trim())}
                        className="flex items-center px-3 py-2 text-blue-600 cursor-pointer hover:bg-blue-50 rounded"
                        style={{ userSelect: "none" }}
                      >
                        <Plus className="h-3 w-3 mr-2" />
                        Crear "{newTag}"
                      </div>
                    );
                  }
                  if (validTags.length === 0) {
                    return (
                      <CommandEmpty>
                        Sin resultados
                      </CommandEmpty>
                    );
                  }
                  return (
                    <CommandGroup>
                      {validTags.map((tag) => (
                        <CommandItem
                          key={tag}
                          onSelect={() => handleAddTag(tag)}
                        >
                          {tag}
                        </CommandItem>
                      ))}
                      {newTag.trim() !== "" && !validTags.includes(newTag.trim()) && (
                        <CommandItem
                          disabled={false}
                          aria-disabled={false}
                          onSelect={() => handleAddTag(newTag.trim())}
                          onClick={() => handleAddTag(newTag.trim())}
                          className="text-blue-600 cursor-pointer"
                        >
                          <Plus className="h-3 w-3 mr-2" />
                          Crear "{newTag}"
                        </CommandItem>
                      )}
                    </CommandGroup>
                  );
                })()}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
} 