import { Label } from "../ui/label";
import { Input } from "../ui/input";

interface InputProps {
  label?: string;
  type: string;
  id: string;
  isLabel?: boolean;
  placeholder?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  value?: string;
  error?: string;
}

const InputComponent: React.FC<InputProps> = ({
  label,
  type,
  id,
  placeholder,
  isLabel,
  onChange,
  value,
  error,
}) => {
  return (
    <div>
      {isLabel && (
        <Label htmlFor={type} className="p-1 mb-2 text-blue text-lg font-semibold">
          {label}
        </Label>
      )}
      <Input
        type={type}
        id={id}
        placeholder={placeholder}
        onChange={onChange}
        value={value}
        className="h-[50px] border-blue rounded-xl w-full"
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default InputComponent;
