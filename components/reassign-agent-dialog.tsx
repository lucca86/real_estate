"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserCog, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { reassignClientAgent } from "@/lib/actions/clients"
import { useRouter } from "next/navigation"

interface Agent {
  id: string
  name: string
  email: string
}

interface ReassignAgentDialogProps {
  clientId: string
  clientName: string
  currentAgentId: string | null
  agents: Agent[]
}

export function ReassignAgentDialog({ clientId, clientName, currentAgentId, agents }: ReassignAgentDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedAgentId, setSelectedAgentId] = useState(currentAgentId || "")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  async function handleReassign() {
    if (!selectedAgentId) {
      toast({
        title: "Error",
        description: "Debes seleccionar un agente",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const result = await reassignClientAgent(clientId, selectedAgentId)

      if (result.success) {
        toast({
          title: "Agente reasignado",
          description: result.message,
        })
        setOpen(false)
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <UserCog className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reasignar Agente</DialogTitle>
          <DialogDescription>
            Selecciona el nuevo agente responsable para <strong>{clientName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un agente" />
            </SelectTrigger>
            <SelectContent>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name} ({agent.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleReassign} disabled={isLoading || !selectedAgentId}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reasignar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
