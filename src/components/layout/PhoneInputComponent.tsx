"use client";
import { Label } from "../ui/label";
import PhoneInput, { type Value } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import "./css/phone-input.css";

interface PhoneInputProps {
  label?: string;
  id: string;
  isLabel?: boolean;
  placeholder?: string;
  onChange?: (value: string) => void;
  value?: string;
  error?: string;
}

const PhoneInputComponent: React.FC<PhoneInputProps> = ({
  label,
  id,
  placeholder,
  isLabel,
  onChange,
  value,
  error,
}) => {
  const handleChange = (newValue: Value) => {
    if (onChange) {
      onChange(newValue || "");
    }
  };

  return (
    <div>
      {isLabel && (
        <Label htmlFor={id} className="p-1 mb-2 text-blue text-lg font-semibold">
          {label}
        </Label>
      )}

      <div className="relative">
        <PhoneInput
          international
          defaultCountry="DE"
          value={value as Value}
          onChange={handleChange}
          placeholder={placeholder || "Telefonnummer eingeben"}
          id={id}
          className="phone-input-custom"
        />
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default PhoneInputComponent;
