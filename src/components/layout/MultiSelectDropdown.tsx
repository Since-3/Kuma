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
import { Checkbox } from "../ui/checkbox";

interface MultiSelectDropdownProps {
  label: string;
  selected: string[];
  onSelect: (values: string[]) => void;
  options: { value: string; label: string }[];
  error?: string;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  selected,
  onSelect,
  options,
  error,
}) => {
  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onSelect(selected.filter((item) => item !== value));
    } else {
      onSelect([...selected, value]);
    }
  };

  const displayValue =
    selected.length > 0
      ? options
          .filter((opt) => selected.includes(opt.value))
          .map((opt) => opt.label)
          .join(", ")
      : "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="relative w-full">
          <Label className="p-1 mb-2 text-blue text-lg font-semibold">{label}</Label>
          <Input
            className="h-[50px] border-blue rounded-xl w-full cursor-pointer pr-10"
            value={displayValue}
            placeholder="Auswählen..."
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
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              onSelect([]);
            }}
            className="text-gray-500"
          >
            Auswahl löschen
          </DropdownMenuItem>
          {options.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onSelect={(e) => {
                e.preventDefault();
                toggleOption(option.value);
              }}
              className="flex items-center gap-2"
            >
              <Checkbox checked={selected.includes(option.value)} className="h-4 w-4" />
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default MultiSelectDropdown;
