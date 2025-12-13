import { AlertTriangle } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "../ui/dialog";

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseName?: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({
  open,
  onOpenChange,
  courseName,
  onConfirm,
  isLoading,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex gap-4 items-center text-xl">
            <AlertTriangle /> Kurs wirklich löschen?
          </DialogTitle>
          <DialogDescription className="mt-2 text-gray-600">
            Der Kurs <span className="font-semibold text-gray-600">{courseName}</span> wird
            dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose className="mt-6 flex gap-2" asChild>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
          </DialogClose>
          <Button variant="destructive" className="mt-6" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Lösche..." : "Kurs löschen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteDialog;
