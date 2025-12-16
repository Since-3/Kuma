"use client";
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../ui/dropdown-menu";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { ChevronDown } from "lucide-react";

const GENDER_OPTIONS = [
  { value: "Men", label: "Männlich" },
  { value: "Woman", label: "Weiblich" },
  { value: "Various", label: "Divers" },
] as const;

interface DropdownComponentProps {
  label: string;
  selected: string;
  onSelect: (value: string) => void;
  error?: string;
}

const DropdownComponent: React.FC<DropdownComponentProps> = ({
  label,
  selected,
  onSelect,
  error,
}) => {
  const selectedLabel = GENDER_OPTIONS.find((g) => g.value === selected)?.label ?? "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="relative w-full">
          <Label className="p-1 mb-2 text-blue text-lg font-semibold">{label}</Label>
          <Input
            className="h-[50px] border-blue rounded-xl w-full cursor-pointer pr-10"
            value={selectedLabel}
            readOnly
          />
          <ChevronDown
            className="absolute right-3 top-[75%] transform -translate-y-1/2 text-blue pointer-events-none"
            size={24}
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => onSelect("")} className="text-gray-500">
            Auswahl löschen
          </DropdownMenuItem>
          {GENDER_OPTIONS.map((option) => (
            <DropdownMenuItem key={option.value} onSelect={() => onSelect(option.value)}>
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DropdownComponent;
