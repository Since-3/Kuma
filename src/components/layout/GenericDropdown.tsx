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

interface GenericDropdownProps {
  label: string;
  selected: string;
  onSelect: (value: string) => void;
  options: { value: string; label: string }[];
  error?: string;
  placeholder?: string;
  disabled?: boolean;
}

const GenericDropdown: React.FC<GenericDropdownProps> = ({
  label,
  selected,
  onSelect,
  options,
  error,
  placeholder = "Auswählen...",
  disabled,
}) => {
  const displayValue = options.find((opt) => opt.value === selected)?.label || "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <div className="relative w-full">
          <Label className="p-1 mb-2 text-blue text-lg font-semibold">{label}</Label>
          <Input
            className="h-[50px] border-blue rounded-xl w-full cursor-pointer pr-10"
            value={displayValue}
            placeholder={placeholder}
            readOnly
          />
          <ChevronDown
            className="absolute right-3 top-[75%] transform -translate-y-1/2 text-blue pointer-events-none"
            size={24}
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width)">
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => onSelect("")} className="text-gray-500">
            Auswahl löschen
          </DropdownMenuItem>
          {options.map((option) => (
            <DropdownMenuItem key={option.value} onSelect={() => onSelect(option.value)}>
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default GenericDropdown;
