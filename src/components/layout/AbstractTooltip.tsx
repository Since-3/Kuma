"use client";
import { useIsMobile } from "@/src/hooks/use-mobile";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

interface AbstractTooltipProps {
  tooltipText: string;
  children: React.ReactNode;
}

const AbstractTooltip: React.FC<AbstractTooltipProps> = ({ tooltipText, children }) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Popover>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent
          side="top"
          align="center"
          className="w-auto px-3 py-1 text-sm text-white bg-blue"
        >
          {tooltipText}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="top" align="center">
        {tooltipText}
      </TooltipContent>
    </Tooltip>
  );
};

export default AbstractTooltip;
