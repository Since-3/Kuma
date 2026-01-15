"use client";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputProps {
  label?: string;
  type: string;
  id: string;
  isLabel?: boolean;
  placeholder?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  value?: string;
  error?: string;
  max?: string;
}

const InputComponent: React.FC<InputProps> = ({
  label,
  type,
  id,
  placeholder,
  isLabel,
  onChange,
  onBlur,
  onFocus,
  value,
  max,
  error,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";

  return (
    <div>
      {isLabel && (
        <Label htmlFor={type} className="p-1 mb-2 text-blue text-lg font-semibold">
          {label}
        </Label>
      )}

      <div className="relative">
        <Input
          type={isPassword && showPassword ? "text" : type}
          id={id}
          placeholder={placeholder}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          value={value}
          max={max}
          className="h-[50px] border-blue rounded-xl w-full"
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
          >
            {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
        )}
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default InputComponent;
