"use client";

import { useState } from "react";
import { Switch } from "@/src/components/ui/switch";
import { Label } from "@/src/components/ui/label";
import { Link, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { toggleBusinessPublic } from "@/src/modules/courses/actions/course-actions";

interface BusinessPublicToggleProps {
  businessId: string;
  businessName: string;
  initialIsPublic: boolean;
  initialSlug: string | null;
}

const BusinessPublicToggle = ({
  businessId,
  businessName,
  initialIsPublic,
  initialSlug,
}: BusinessPublicToggleProps) => {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [slug, setSlug] = useState(initialSlug);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const publicUrl = slug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/business/${slug}`
    : null;

  const handleToggle = async (checked: boolean) => {
    setIsLoading(true);
    const result = await toggleBusinessPublic(businessId, checked);
    if (result.success) {
      setIsPublic(checked);
      if (result.slug) setSlug(result.slug);
      toast.success(checked ? "Seite veröffentlicht" : "Seite versteckt");
    } else {
      toast.error(result.error ?? "Fehler beim Aktualisieren");
    }
    setIsLoading(false);
  };

  const handleCopy = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success("Link kopiert");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Link konnte nicht kopiert werden");
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl p-5 bg-white flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{businessName}</h3>
          <p className="text-sm text-gray-500 mt-0.5">Öffentliche Kursseite</p>
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor={`toggle-${businessId}`} className="text-sm text-gray-600 cursor-pointer">
            {isPublic ? "Veröffentlicht" : "Nicht öffentlich"}
          </Label>
          <Switch
            id={`toggle-${businessId}`}
            checked={isPublic}
            onCheckedChange={handleToggle}
            disabled={isLoading}
          />
        </div>
      </div>

      {isPublic && publicUrl && (
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <Link size={15} className="text-gray-400 shrink-0" />
          <span className="text-sm text-gray-700 truncate flex-1">{publicUrl}</span>
          <button
            onClick={handleCopy}
            className="shrink-0 p-1 rounded hover:bg-gray-200 transition"
            title="Link kopieren"
          >
            {copied ? (
              <Check size={15} className="text-green-600" />
            ) : (
              <Copy size={15} className="text-gray-500" />
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default BusinessPublicToggle;
