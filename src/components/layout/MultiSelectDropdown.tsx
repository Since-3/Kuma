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
import { ChevronDown, Plus, X } from "lucide-react";
import { Checkbox } from "../ui/checkbox";
import { useState } from "react";
import { Button } from "../ui/button";

interface MultiSelectDropdownProps {
  label: string;
  selected: string[];
  onSelect: (values: string[]) => void;
  options: { value: string; label: string }[];
  error?: string;
  allowCreate?: boolean;
  onCreateOption?: (newOption: { value: string; label: string }) => void;
  onDeleteOption?: (value: string) => void;
  deletableValues?: string[];
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  selected,
  onSelect,
  options,
  error,
  allowCreate = false,
  onCreateOption,
  onDeleteOption,
  deletableValues = [],
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newOptionLabel, setNewOptionLabel] = useState("");

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onSelect(selected.filter((item) => item !== value));
    } else {
      onSelect([...selected, value]);
    }
  };

  const handleCreateOption = () => {
    if (newOptionLabel.trim() && onCreateOption) {
      const newValue = newOptionLabel.toLowerCase().replace(/\s+/g, "-");
      const newOption = { value: newValue, label: newOptionLabel.trim() };
      onCreateOption(newOption);
      onSelect([...selected, newValue]);
      setNewOptionLabel("");
      setIsCreating(false);
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
              className="flex items-center gap-2 justify-between"
            >
              <div className="flex items-center gap-2">
                <Checkbox checked={selected.includes(option.value)} className="h-4 w-4" />
                {option.label}
              </div>
              {deletableValues.includes(option.value) && onDeleteOption && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteOption(option.value);
                  }}
                  className="p-1 hover:bg-red-100 rounded text-red-500 hover:text-red-700"
                  title="Rolle löschen"
                >
                  <X size={14} />
                </button>
              )}
            </DropdownMenuItem>
          ))}
          {allowCreate && !isCreating && (
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setIsCreating(true);
              }}
              className="flex items-center gap-2 text-blue font-semibold"
            >
              <Plus size={16} />
              Neue Rolle anlegen
            </DropdownMenuItem>
          )}
          {allowCreate && isCreating && (
            <div
              className="p-2 space-y-2"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <Input
                value={newOptionLabel}
                onChange={(e) => setNewOptionLabel(e.target.value)}
                placeholder="Neue Rolle eingeben..."
                className="h-8"
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Enter") {
                    handleCreateOption();
                  } else if (e.key === "Escape") {
                    setIsCreating(false);
                    setNewOptionLabel("");
                  }
                }}
                autoFocus
              />
              <div className="flex gap-1">
                <Button
                  size="sm"
                  onClick={handleCreateOption}
                  className="h-7 text-xs"
                  disabled={!newOptionLabel.trim()}
                >
                  Hinzufügen
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setNewOptionLabel("");
                  }}
                  className="h-7 text-xs"
                >
                  Abbrechen
                </Button>
              </div>
            </div>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default MultiSelectDropdown;
