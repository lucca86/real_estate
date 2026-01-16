"use client"

import type { PropertyFeature } from "@/lib/actions/property-features"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  label: string
  features: PropertyFeature[]
  selectedIds: string[]
  onChange: (selectedIds: string[]) => void
}

export function PropertyFeaturesSelector({ label, features, selectedIds, onChange }: Props) {
  const [open, setOpen] = useState(false)

  const selectedFeatures = features.filter((f) => selectedIds.includes(f.id))

  const toggleFeature = (featureId: string) => {
    if (selectedIds.includes(featureId)) {
      onChange(selectedIds.filter((id) => id !== featureId))
    } else {
      onChange([...selectedIds, featureId])
    }
  }

  const removeFeature = (featureId: string) => {
    onChange(selectedIds.filter((id) => id !== featureId))
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-transparent"
          >
            {selectedFeatures.length > 0 ? `${selectedFeatures.length} seleccionadas` : "Seleccionar..."}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Buscar..." />
            <CommandList>
              <CommandEmpty>No se encontraron resultados.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                {features.map((feature) => (
                  <CommandItem key={feature.id} onSelect={() => toggleFeature(feature.id)}>
                    <Check
                      className={cn("mr-2 h-4 w-4", selectedIds.includes(feature.id) ? "opacity-100" : "opacity-0")}
                    />
                    {feature.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedFeatures.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedFeatures.map((feature) => (
            <Badge key={feature.id} variant="secondary">
              {feature.name}
              <button
                type="button"
                onClick={() => removeFeature(feature.id)}
                className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
