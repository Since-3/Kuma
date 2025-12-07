"use client";
import { useState } from "react";
import InputComponent from "@/src/components/layout/InputComponent";
import GenericDropdown from "@/src/components/layout/GenericDropdown";
import MultiSelectDropdown from "@/src/components/layout/MultiSelectDropdown";
import RichTextEditor from "@/src/components/layout/RichTextEditor";
import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Label } from "@/src/components/ui/label";

// Hardcoded data
const SPORTS = [
  { value: "football", label: "Fußball" },
  { value: "basketball", label: "Basketball" },
  { value: "volleyball", label: "Volleyball" },
  { value: "tennis", label: "Tennis" },
  { value: "swimming", label: "Schwimmen" },
  { value: "yoga", label: "Yoga" },
];

const TRAINERS = [
  { value: "trainer1", label: "Max Mustermann" },
  { value: "trainer2", label: "Anna Schmidt" },
  { value: "trainer3", label: "Peter Weber" },
  { value: "trainer4", label: "Lisa Müller" },
];

const ROOMS = [
  { value: "room1", label: "Sporthalle 1" },
  { value: "room2", label: "Sporthalle 2" },
  { value: "room3", label: "Gymnastikraum" },
  { value: "room4", label: "Schwimmbad" },
  { value: "room5", label: "Tennisplatz" },
];

const FREQUENCIES = [
  { value: "daily", label: "Täglich" },
  { value: "weekly", label: "Wöchentlich" },
  { value: "biweekly", label: "Alle 2 Wochen" },
  { value: "monthly", label: "Monatlich" },
  { value: "custom", label: "Individuell" },
];

const WEEKDAYS = [
  { value: "monday", label: "Montag" },
  { value: "tuesday", label: "Dienstag" },
  { value: "wednesday", label: "Mittwoch" },
  { value: "thursday", label: "Donnerstag" },
  { value: "friday", label: "Freitag" },
  { value: "saturday", label: "Samstag" },
  { value: "sunday", label: "Sonntag" },
];

const CourseCreateView = () => {
  const [selectedSport, setSelectedSport] = useState("");
  const [selectedTrainers, setSelectedTrainers] = useState<string[]>([]);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [description, setDescription] = useState("");
  const [isStandingOrder, setIsStandingOrder] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState("");
  const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>([]);

  return (
    <div>
      <h1 className="text-3xl font-bold">Kurs anlegen </h1>
      <p className="text-xl mt-2">
        Alle Kurse können nach dem Speichern angepasst oder gelöscht werden
      </p>
      <div className="mt-6 flex flex-col gap-4 max-w-xl">
        <InputComponent isLabel label="Kursnamen" type="text" id="course-create-name" />

        <GenericDropdown
          label="Sportart"
          selected={selectedSport}
          onSelect={setSelectedSport}
          options={SPORTS}
        />

        <InputComponent isLabel label="Datum" type="date" id="course-create-date" />

        <InputComponent isLabel label="Uhrzeit" type="time" id="course-create-time" />

        <MultiSelectDropdown
          label="Trainer"
          selected={selectedTrainers}
          onSelect={setSelectedTrainers}
          options={TRAINERS}
        />

        <GenericDropdown
          label="Raum"
          selected={selectedRoom}
          onSelect={setSelectedRoom}
          options={ROOMS}
        />

        <RichTextEditor
          label="Was man mitbringen sollte"
          value={description}
          onChange={setDescription}
          placeholder="Beschreibe, was die Teilnehmer mitbringen sollten..."
        />

        <div className="flex items-center gap-2">
          <Checkbox
            id="course-create-standing-order"
            className="shadow-none h-5 w-5 bg-white border-blue cursor-pointer"
            checked={isStandingOrder}
            onCheckedChange={(checked) => {
              setIsStandingOrder(checked === true);
              if (!checked) {
                setSelectedFrequency("");
                setSelectedWeekdays([]);
              }
            }}
          />
          <Label htmlFor="course-create-standing-order" className="cursor-pointer text-lg mt-2">
            Als Dauerauftrag anlegen
          </Label>
        </div>

        {isStandingOrder && (
          <>
            <GenericDropdown
              label="Wie oft soll dieser Kurs stattfinden?"
              selected={selectedFrequency}
              onSelect={(value) => {
                setSelectedFrequency(value);
                if (value !== "custom") {
                  setSelectedWeekdays([]);
                }
              }}
              options={FREQUENCIES}
            />

            {selectedFrequency === "custom" && (
              <MultiSelectDropdown
                label="An welchen Tagen soll der Kurs stattfinden?"
                selected={selectedWeekdays}
                onSelect={setSelectedWeekdays}
                options={WEEKDAYS}
              />
            )}
          </>
        )}
        <div className="flex gap-2">
          <Button>Veröffentlichen</Button>
          <Button variant="outline">Abbrechen</Button>
        </div>
        <button className="mt-6 w-fit cursor-pointer hover:underline">Entwurf speichern</button>
        <button className="mb-6 w-fit cursor-pointer hover:underline">Als Vorlage speichern</button>
      </div>
    </div>
  );
};

export default CourseCreateView;
