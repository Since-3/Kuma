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

interface CourseFilterProps {
  children: React.ReactNode;

  // values
  filterStatus: FilterStatus;
  filterSport: string;
  filterTrainer: string;
  filterRoom: string;
  dateFrom: string;
  dateTo: string;
  timeFrom: string;
  timeTo: string;
  uniqueSports: string[];
  uniqueTrainers: string[];
  uniqueRooms: string[];

  // setters
  setFilterStatus: (v: FilterStatus) => void;
  setFilterSport: (v: string) => void;
  setFilterTrainer: (v: string) => void;
  setFilterRoom: (v: string) => void;
  setDateFrom: (v: string) => void;
  setDateTo: (v: string) => void;
  setTimeFrom: (v: string) => void;
  setTimeTo: (v: string) => void;

  // actions
  onReset: () => void;
}

const CourseFilter: React.FC<CourseFilterProps> = ({
  children,
  filterStatus,
  filterSport,
  filterTrainer,
  filterRoom,
  dateFrom,
  dateTo,
  timeFrom,
  timeTo,
  uniqueSports,
  uniqueTrainers,
  uniqueRooms,
  setFilterStatus,
  setFilterSport,
  setFilterTrainer,
  setFilterRoom,
  setDateFrom,
  setDateTo,
  setTimeFrom,
  setTimeTo,
  onReset,
}) => {
  const hasActiveFilters =
    filterStatus !== "all" ||
    filterSport !== "all" ||
    filterTrainer !== "all" ||
    filterRoom !== "all" ||
    !!dateFrom ||
    !!dateTo ||
    !!timeFrom ||
    !!timeTo;
  const [priceValue, setPriceValue] = useState([0, 50]);

  return (
    <Sheet>
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
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-10 w-full px-3 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition"
            />
          </div>

          {/* To */}
          <div className="space-y-1">
            <label className="font-medium">Bis</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-10 w-full px-3 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition"
            />
          </div>

          {/* Trainer */}
          <div className="space-y-1">
            <label className="font-medium">Trainer</label>
            <select
              value={filterTrainer}
              onChange={(e) => setFilterTrainer(e.target.value)}
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
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
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
              value={filterSport}
              onChange={(e) => setFilterSport(e.target.value)}
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

          {/* TODO: Price */}
          <div className="space-y-1">
            <label className="font-medium">Preis</label>
            <Slider
              className="mt-1"
              value={priceValue}
              onValueChange={setPriceValue}
              max={50}
              step={1}
            />
            <div className="flex justify-between mt-2">
              <span>{priceValue[0]}€</span>
              <span>{priceValue[1]}€</span>
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
                    value={filterRoom}
                    onChange={(e) => setFilterRoom(e.target.value)}
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

                {/* TODO: Niveau */}
                <div className="space-y-1">
                  <label className="font-medium">Niveau</label>
                  <select className="h-10 w-full px-3 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition">
                    <option value="everyone">Jedes Niveau</option>
                    <option value="beginner">Anfänger</option>
                    <option value="intermediate">Fortgeschritten</option>
                    <option value="advanced">Profi</option>
                  </select>
                </div>

                {/* Uhrzeit */}
                <h3 className=" font-medium mt-2">Uhrzeit</h3>

                {/* From */}
                <div className="space-y-1">
                  <label className="font-medium">Von</label>
                  <input
                    type="time"
                    value={timeFrom}
                    onChange={(e) => setTimeFrom(e.target.value)}
                    className="h-10 w-full px-3 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition"
                  />
                </div>

                {/* To */}
                <div className="space-y-1">
                  <label className="font-medium">Bis</label>
                  <input
                    type="time"
                    value={timeTo}
                    onChange={(e) => setTimeTo(e.target.value)}
                    className="h-10 w-full px-3 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <SheetFooter className="flex flex-row items-center w-full justify-end gap-2 border-t pt-4">
          {hasActiveFilters && (
            <Button variant="outline" onClick={onReset}>
              Zurücksetzen
            </Button>
          )}

          {/* Schließt das Sheet */}
          <SheetClose asChild>
            <Button>Filtern</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default CourseFilter;
