"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";

export type StandingOrderScope = "this" | "this_and_following" | "all";

interface StandingOrderScopeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (scope: StandingOrderScope) => void;
  action: "edit" | "delete";
}

const LABELS = {
  edit: {
    title: "Dauerauftrag bearbeiten",
    description: "Welche Termine sollen geändert werden?",
    this: "Nur diesen Termin",
    this_and_following: "Diesen und alle folgenden Termine",
    all: "Alle Termine",
  },
  delete: {
    title: "Dauerauftrag löschen",
    description: "Welche Termine sollen gelöscht werden?",
    this: "Nur diesen Termin",
    this_and_following: "Diesen und alle folgenden Termine",
    all: "Alle Termine",
  },
} as const;

export function StandingOrderScopeDialog({
  open,
  onOpenChange,
  onConfirm,
  action,
}: StandingOrderScopeDialogProps) {
  const labels = LABELS[action];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
          <DialogDescription>{labels.description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-2">
          <Button variant="outline" onClick={() => onConfirm("this")} className="justify-start">
            {labels.this}
          </Button>
          <Button
            variant="outline"
            onClick={() => onConfirm("this_and_following")}
            className="justify-start"
          >
            {labels.this_and_following}
          </Button>
          <Button
            variant={action === "delete" ? "destructive" : "default"}
            onClick={() => onConfirm("all")}
            className="justify-start"
          >
            {labels.all}
          </Button>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
