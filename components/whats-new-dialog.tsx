"use client"

import { Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CHANGELOG, CHANGE_TYPE_LABELS, type ChangeType } from "@/lib/changelog"
import { APP_VERSION } from "@/lib/version"
import { cn } from "@/lib/utils"

const TYPE_STYLES: Record<ChangeType, string> = {
  nuevo: "border-transparent bg-primary text-primary-foreground",
  mejora: "border-transparent bg-secondary text-secondary-foreground",
  correccion: "border-border bg-background text-foreground",
}

interface WhatsNewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WhatsNewDialog({ open, onOpenChange }: WhatsNewDialogProps) {
  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric" }).format(
      new Date(`${iso}T12:00:00`),
    )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-border px-6 py-5 text-left">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-0.5">
              <DialogTitle className="text-lg">Lo nuevo</DialogTitle>
              <DialogDescription>
                Versión actual: <span className="font-medium text-foreground">v{APP_VERSION}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <ol className="flex flex-col px-6 py-5">
            {CHANGELOG.map((entry, index) => {
              const isCurrent = entry.version === APP_VERSION
              const isLast = index === CHANGELOG.length - 1
              return (
                <li key={entry.version} className="relative flex gap-4 pb-8 last:pb-0">
                  {!isLast && (
                    <span className="absolute left-[7px] top-5 h-[calc(100%-1rem)] w-px bg-border" aria-hidden="true" />
                  )}
                  <span
                    className={cn(
                      "relative mt-1.5 h-[15px] w-[15px] shrink-0 rounded-full border-2",
                      isCurrent ? "border-primary bg-primary" : "border-border bg-background",
                    )}
                    aria-hidden="true"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <h3 className="text-base font-semibold text-foreground">v{entry.version}</h3>
                      {isCurrent && (
                        <Badge variant="outline" className="border-primary text-primary">
                          Actual
                        </Badge>
                      )}
                      <time dateTime={entry.date} className="text-xs text-muted-foreground">
                        {formatDate(entry.date)}
                      </time>
                    </div>
                    <p className="text-sm font-medium text-foreground">{entry.title}</p>
                    <ul className="flex flex-col gap-2">
                      {entry.changes.map((change) => (
                        <li key={change.text} className="flex items-start gap-3 text-sm leading-relaxed">
                          <Badge variant="outline" className={cn("mt-0.5 shrink-0", TYPE_STYLES[change.type])}>
                            {CHANGE_TYPE_LABELS[change.type]}
                          </Badge>
                          <span className="text-muted-foreground">{change.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              )
            })}
          </ol>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
