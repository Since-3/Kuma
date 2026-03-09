"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, X } from "lucide-react";

interface ImageUploadComponentProps {
  value: File | null;
  preview: string | null;
  onChange: (file: File | null, preview: string | null) => void;
  error?: string;
}

const ImageUploadComponent = ({ value, preview, onChange, error }: ImageUploadComponentProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    onChange(file, url);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null, null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        onClick={() => !preview && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative w-28 h-28 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors overflow-hidden
          ${isDragging ? "border-blue bg-blue/5" : "border-gray-300 hover:border-blue hover:bg-gray-50"}
          ${preview ? "border-solid border-blue cursor-default" : ""}
        `}
      >
        {preview ? (
          <>
            <Image src={preview} alt="Profilbild Vorschau" fill className="object-cover" />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-1 right-1 bg-white rounded-full p-0.5 shadow hover:bg-red-50 transition-colors z-10"
            >
              <X size={14} className="text-red-500" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-gray-400">
            <Camera size={28} />
            <span className="text-xs text-center leading-tight px-2">Foto hochladen</span>
          </div>
        )}
      </div>

      {!preview && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-sm text-blue underline cursor-pointer"
        >
          Bild auswählen
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

export default ImageUploadComponent;
