import Image from "next/image";
import MultiStepProzess from "./MultiStepProzess";
import Logo from "@/src/public/logo.png";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/src/components/ui/card";

interface AuthSidebarComponentProps {
  title: string;
  description?: string;
  footer: string;
  isSteps?: boolean;
  step?: number;
  totalSteps?: number;
  onStepChange?: (step: number) => void;
}

const AuthSidebarComponent: React.FC<AuthSidebarComponentProps> = ({
  title,
  description,
  footer,
  isSteps,
  step = 1,
  totalSteps = 2,
  onStepChange,
}) => {
  return (
    <Card className="bg-blue border-0 w-full h-full p-6 lg:p-8 xl:p-12 flex flex-col justify-between">
      <CardHeader className="p-0 pb-4">
        <CardTitle>
          <Image
            src={Logo}
            width={150}
            height={150}
            alt="Logo"
            className="w-auto h-auto max-w-[120px] lg:max-w-[150px]"
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="text-yellow flex flex-col gap-4 lg:gap-6 xl:gap-8 flex-1 p-0">
        <h1 className="text-2xl lg:text-3xl xl:text-[40px] max-w-full font-bold mt-2 lg:mt-4 xl:mt-8">
          {title}
        </h1>
        {description && <p className="text-sm lg:text-base">{description}</p>}
        {isSteps && (
          <MultiStepProzess step={step} totalSteps={totalSteps} onStepChange={onStepChange} />
        )}
      </CardContent>
      <CardFooter className="pointer-events-auto p-0 pt-4 mt-auto">
        <p className="text-yellow text-sm lg:text-base break-words">
          Bei Fragen:{" "}
          <a href={`mailto:info@since3.de`} className="hover:underline">
            {footer}
          </a>
        </p>
      </CardFooter>
    </Card>
  );
};

export default AuthSidebarComponent;
