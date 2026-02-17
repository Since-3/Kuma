import { Button } from "@/src/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/src/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/components/ui/accordion";
import { Slider } from "@/src/components/ui/slider";
import React, { useState } from "react";

type FilterStatus = "all" | "draft" | "published";

interface FilterValues {
  filterStatus: FilterStatus;
  filterSport: string;
  filterTrainer: string;
  filterRoom: string;
  filterLevel: string;
  dateFrom: string;
  dateTo: string;
  timeFrom: string;
  timeTo: string;
  priceMin: number;
  priceMax: number;
}

interface CourseFilterProps {
  children: React.ReactNode;

  // current applied values
  filterStatus: FilterStatus;
  filterSport: string;
  filterTrainer: string;
  filterRoom: string;
  filterLevel: string;
  dateFrom: string;
  dateTo: string;
  timeFrom: string;
  timeTo: string;
  priceMin: number;
  priceMax: number;
  priceRangeMin: number;
  priceRangeMax: number;
  uniqueSports: string[];
  uniqueTrainers: string[];
  uniqueRooms: string[];

  // callback when filters are applied
  onApplyFilters: (filters: FilterValues) => void;

  // actions
  onReset: () => void;
}

const CourseFilter: React.FC<CourseFilterProps> = ({
  children,
  filterStatus,
  filterSport,
  filterTrainer,
  filterRoom,
  filterLevel,
  dateFrom,
  dateTo,
  timeFrom,
  timeTo,
  priceMin,
  priceMax,
  priceRangeMin,
  priceRangeMax,
  uniqueSports,
  uniqueTrainers,
  uniqueRooms,
  onApplyFilters,
  onReset,
}) => {
  // Local state for temporary filter values (before applying)
  const [localStatus, setLocalStatus] = useState<FilterStatus>(filterStatus);
  const [localSport, setLocalSport] = useState(filterSport);
  const [localTrainer, setLocalTrainer] = useState(filterTrainer);
  const [localRoom, setLocalRoom] = useState(filterRoom);
  const [localLevel, setLocalLevel] = useState(filterLevel);
  const [localDateFrom, setLocalDateFrom] = useState(dateFrom);
  const [localDateTo, setLocalDateTo] = useState(dateTo);
  const [localTimeFrom, setLocalTimeFrom] = useState(timeFrom);
  const [localTimeTo, setLocalTimeTo] = useState(timeTo);
  const [localPriceMin, setLocalPriceMin] = useState(priceMin);
  const [localPriceMax, setLocalPriceMax] = useState(priceMax);
  const [isOpen, setIsOpen] = useState(false);

  // Sync local state when sheet opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setLocalStatus(filterStatus);
      setLocalSport(filterSport);
      setLocalTrainer(filterTrainer);
      setLocalRoom(filterRoom);
      setLocalLevel(filterLevel);
      setLocalDateFrom(dateFrom);
      setLocalDateTo(dateTo);
      setLocalTimeFrom(timeFrom);
      setLocalTimeTo(timeTo);
      setLocalPriceMin(priceMin);
      setLocalPriceMax(priceMax);
    }
    setIsOpen(open);
  };

  const hasActiveFilters =
    filterStatus !== "all" ||
    filterSport !== "all" ||
    filterTrainer !== "all" ||
    filterRoom !== "all" ||
    filterLevel !== "all" ||
    !!dateFrom ||
    !!dateTo ||
    !!timeFrom ||
    !!timeTo ||
    priceMin !== priceRangeMin ||
    priceMax !== priceRangeMax;

  const handleApplyFilters = () => {
    onApplyFilters({
      filterStatus: localStatus,
      filterSport: localSport,
      filterTrainer: localTrainer,
      filterRoom: localRoom,
      filterLevel: localLevel,
      dateFrom: localDateFrom,
      dateTo: localDateTo,
      timeFrom: localTimeFrom,
      timeTo: localTimeTo,
      priceMin: localPriceMin,
      priceMax: localPriceMax,
    });
  };

  const handleReset = () => {
    setLocalStatus("all");
    setLocalSport("all");
    setLocalTrainer("all");
    setLocalRoom("all");
    setLocalLevel("all");
    setLocalDateFrom("");
    setLocalDateTo("");
    setLocalTimeFrom("");
    setLocalTimeTo("");
    setLocalPriceMin(priceRangeMin);
    setLocalPriceMax(priceRangeMax);
    onReset();
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="text-2xl">Kurse Filtern</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-4 p-4">
          {/* Datum */}
          <h2 className="text-lg">Datum</h2>

          {/* From */}
          <div className="space-y-1">
            <label className="font-medium">Von</label>
            <input
              type="date"
              value={localDateFrom}
              onChange={(e) => setLocalDateFrom(e.target.value)}
              className="h-10 w-full px-3 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition"
            />
          </div>

          {/* To */}
          <div className="space-y-1">
            <label className="font-medium">Bis</label>
            <input
              type="date"
              value={localDateTo}
              onChange={(e) => setLocalDateTo(e.target.value)}
              className="h-10 w-full px-3 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition"
            />
          </div>

          {/* Trainer */}
          <div className="space-y-1">
            <label className="font-medium">Trainer</label>
            <select
              value={localTrainer}
              onChange={(e) => setLocalTrainer(e.target.value)}
              className="h-10 w-full px-3 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition"
            >
              <option value="all">Alle</option>
              {uniqueTrainers.map((trainer) => (
                <option key={trainer} value={trainer}>
                  {trainer}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <label className="font-medium">Status</label>
            <select
              value={localStatus}
              onChange={(e) => setLocalStatus(e.target.value as FilterStatus)}
              className="h-10 w-full px-3 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition"
            >
              <option value="all">Alle</option>
              <option value="draft">Entwurf</option>
              <option value="published">Veröffentlicht</option>
            </select>
          </div>

          {/* Sport */}
          <div className="space-y-1">
            <label className="font-medium">Sportart</label>
            <select
              value={localSport}
              onChange={(e) => setLocalSport(e.target.value)}
              className="h-10 w-full px-3 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition"
            >
              <option value="all">Alle</option>
              {uniqueSports.map((sport) => (
                <option key={sport} value={sport}>
                  {sport}
                </option>
              ))}
            </select>
          </div>

          {/* Price */}
          <div className="space-y-1">
            <label className="font-medium">Preis</label>
            <Slider
              className="mt-1"
              value={[localPriceMin, localPriceMax]}
              onValueChange={([min, max]) => {
                setLocalPriceMin(min);
                setLocalPriceMax(max);
              }}
              min={priceRangeMin}
              max={priceRangeMax}
              step={1}
            />
            <div className="flex justify-between mt-2">
              <span>{localPriceMin}€</span>
              <span>{localPriceMax}€</span>
            </div>
          </div>

          {/* Advanced Filter Accordion */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="advanced-filters">
              <AccordionTrigger className="text-base font-medium">
                Erweiterte Filter
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                {/* Room */}
                <div className="space-y-1">
                  <label className="font-medium">Raum</label>
                  <select
                    value={localRoom}
                    onChange={(e) => setLocalRoom(e.target.value)}
                    className="h-10 w-full px-3 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition"
                  >
                    <option value="all">Alle</option>
                    {uniqueRooms.map((room) => (
                      <option key={room} value={room}>
                        {room}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Niveau */}
                <div className="space-y-1">
                  <label className="font-medium">Niveau</label>
                  <select
                    value={localLevel}
                    onChange={(e) => setLocalLevel(e.target.value)}
                    className="h-10 w-full px-3 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition"
                  >
                    <option value="all">Alle</option>
                    <option value="any">Jedes Niveau</option>
                    <option value="beginner">Anfänger</option>
                    <option value="advanced">Fortgeschrittene</option>
                    <option value="pro">Profi</option>
                  </select>
                </div>

                {/* Uhrzeit */}
                <h3 className=" font-medium mt-2">Uhrzeit</h3>

                {/* From */}
                <div className="space-y-1">
                  <label className="font-medium">Von</label>
                  <input
                    type="time"
                    value={localTimeFrom}
                    onChange={(e) => setLocalTimeFrom(e.target.value)}
                    className="h-10 w-full px-3 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition"
                  />
                </div>

                {/* To */}
                <div className="space-y-1">
                  <label className="font-medium">Bis</label>
                  <input
                    type="time"
                    value={localTimeTo}
                    onChange={(e) => setLocalTimeTo(e.target.value)}
                    className="h-10 w-full px-3 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <SheetFooter className="flex flex-row items-center w-full justify-end gap-2 border-t pt-4">
          {hasActiveFilters && (
            <Button variant="outline" onClick={handleReset}>
              Zurücksetzen
            </Button>
          )}

          {/* Schließt das Sheet */}
          <SheetClose asChild>
            <Button onClick={handleApplyFilters}>Filtern</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default CourseFilter;
