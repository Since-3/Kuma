import React from "react";
import MultiStepProzessItem from "./MultiStepProzessItem";

interface MultiStepProzessProps {
  step: number;
  totalSteps: number;
  onStepChange?: (step: number) => void;
}

const MultiStepProzess: React.FC<MultiStepProzessProps> = ({ step, totalSteps, onStepChange }) => {
  return (
    <div>
      <MultiStepProzessItem
        stepTitle="Schritt 1"
        stepDescription="Anmeldedaten"
        isActive={step == 1}
        onClick={() => onStepChange?.(1)}
      />
      <MultiStepProzessItem
        stepTitle="Schritt 2"
        stepDescription="Persönliche Angaben"
        isActive={step == 2}
        onClick={() => onStepChange?.(2)}
      />
      {totalSteps == 3 && (
        <MultiStepProzessItem
          stepTitle="Schritt 3"
          stepDescription="Geschäftsdaten"
          isActive={step == 3}
          onClick={() => onStepChange?.(3)}
        />
      )}
    </div>
  );
};

export default MultiStepProzess;
