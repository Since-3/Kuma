"use client";
import { useState, useEffect, useRef } from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Loader2 } from "lucide-react";

interface NominatimResult {
  place_id: number;
  address: {
    road?: string;
    house_number?: string;
    postcode?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
  };
}

export interface ParsedAddress {
  street: string;
  plz: string;
  place: string;
}

interface AddressAutocompleteProps {
  streetValue: string;
  plzValue: string;
  placeValue: string;
  onStreetChange: (v: string) => void;
  onPlzChange: (v: string) => void;
  onPlaceChange: (v: string) => void;
  onSelect: (parsed: ParsedAddress) => void;
  streetError?: string;
  plzError?: string;
  placeError?: string;
  idPrefix?: string;
}

const DEBOUNCE_MS = 400;

const AddressAutocompleteComponent: React.FC<AddressAutocompleteProps> = ({
  streetValue,
  plzValue,
  placeValue,
  onStreetChange,
  onPlzChange,
  onPlaceChange,
  onSelect,
  streetError,
  plzError,
  placeError,
  idPrefix = "address",
}) => {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (streetRef.current && !streetRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: query,
        format: "json",
        addressdetails: "1",
        limit: "6",
        countrycodes: "de",
      });
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        headers: { "Accept-Language": "de", "User-Agent": "s3-kuma-app/1.0" },
      });
      const data: NominatimResult[] = await res.json();
      const filtered = data.filter((r) => r.address.road);
      setSuggestions(filtered);
      setOpen(filtered.length > 0);
    } catch {
      setSuggestions([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleStreetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onStreetChange(val);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => fetchSuggestions(val), DEBOUNCE_MS);
  };

  const handleSelect = (result: NominatimResult) => {
    const addr = result.address;
    const street =
      addr.road && addr.house_number ? `${addr.road} ${addr.house_number}` : (addr.road ?? "");
    const plz = addr.postcode ?? "";
    const place = addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? "";

    onStreetChange(street);
    onPlzChange(plz);
    onPlaceChange(place);
    onSelect({ street, plz, place });
    setOpen(false);
    setSuggestions([]);
  };

  return (
    <>
      {/* Straße — with autocomplete dropdown */}
      <div ref={streetRef} className="relative">
        <Label htmlFor={`${idPrefix}-street`} className="p-1 mb-2 text-blue text-lg font-semibold">
          Straße und Hausnummer
        </Label>
        <div className="relative">
          <Input
            id={`${idPrefix}-street`}
            type="text"
            autoComplete="off"
            value={streetValue}
            onChange={handleStreetChange}
            onFocus={() => {
              if (suggestions.length > 0) setOpen(true);
            }}
            className="h-[50px] border-blue rounded-xl w-full"
          />
          {loading && (
            <Loader2
              size={18}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-blue animate-spin"
            />
          )}
        </div>
        {streetError && <p className="text-red-500 text-sm mt-1">{streetError}</p>}

        {open && suggestions.length > 0 && (
          <ul className="absolute z-50 mt-1 w-full bg-white border border-blue rounded-xl shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((s) => {
              const addr = s.address;
              const street =
                addr.road && addr.house_number
                  ? `${addr.road} ${addr.house_number}`
                  : (addr.road ?? "");
              const plz = addr.postcode ?? "";
              const place = addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? "";
              return (
                <li
                  key={s.place_id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(s);
                  }}
                  className="px-4 py-2 cursor-pointer hover:bg-blue/10 transition-colors"
                >
                  <span className="block font-medium text-sm">{street}</span>
                  <span className="block text-xs text-gray-500">
                    {plz} {place}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* PLZ */}
      <div>
        <Label htmlFor={`${idPrefix}-plz`} className="p-1 mb-2 text-blue text-lg font-semibold">
          PLZ
        </Label>
        <Input
          id={`${idPrefix}-plz`}
          type="text"
          autoComplete="off"
          value={plzValue}
          onChange={(e) => onPlzChange(e.target.value)}
          className="h-[50px] border-blue rounded-xl w-full"
        />
        {plzError && <p className="text-red-500 text-sm mt-1">{plzError}</p>}
      </div>

      {/* Wohnort */}
      <div>
        <Label htmlFor={`${idPrefix}-place`} className="p-1 mb-2 text-blue text-lg font-semibold">
          Wohnort
        </Label>
        <Input
          id={`${idPrefix}-place`}
          type="text"
          autoComplete="off"
          value={placeValue}
          onChange={(e) => onPlaceChange(e.target.value)}
          className="h-[50px] border-blue rounded-xl w-full"
        />
        {placeError && <p className="text-red-500 text-sm mt-1">{placeError}</p>}
      </div>
    </>
  );
};

export default AddressAutocompleteComponent;
