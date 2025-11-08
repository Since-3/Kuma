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
    <Card className="bg-blue border-0 w-fit h-full p-6 sm:p-12 flex flex-col justify-between">
      <CardHeader>
        <CardTitle>
          <Image src={Logo} width={150} height={150} alt="Logo" />
        </CardTitle>
      </CardHeader>
      <CardContent className="text-yellow flex flex-col gap-12 min-h-[70vh]">
        <h1 className="text-3xl lg:text-[40px] max-w-[300px] font-bold mt-8 lg:mt-12">{title}</h1>
        <p className="text-base">{description}</p>
        {isSteps && (
          <MultiStepProzess step={step} totalSteps={totalSteps} onStepChange={onStepChange} />
        )}
      </CardContent>
      <CardFooter>
        <p className="text-yellow">
          Bei Fragen: <span className=" cursor-pointer hover:underline">{footer}</span>
        </p>
      </CardFooter>
    </Card>
  );
};

export default AuthSidebarComponent;
