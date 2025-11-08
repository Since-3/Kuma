interface MultiStepProzessItemProps {
  stepTitle: string;
  stepDescription: string;
  isActive: boolean;
  onClick?: () => void;
}

const MultiStepProzessItem: React.FC<MultiStepProzessItemProps> = ({
  stepTitle,
  stepDescription,
  isActive,
  onClick,
}) => {
  return (
    <div onClick={onClick} className="w-full flex items-center cursor-pointer  gap-4 mt-6">
      <div
        className={`h-full flex justify-center items-center  rounded-full p-5 ${isActive ? "bg-yellow" : "bg-transparent"} border-2 border-yellow`}
      >
        <div className={`w-full p-1 rounded-full ${isActive ? "bg-blue" : "bg-yellow"}`}></div>
      </div>

      <div className={`flex flex-col text-lg justify-center ${isActive && "font-semibold"}`}>
        <h4>{stepTitle}</h4>
        <p>{stepDescription}</p>
      </div>
    </div>
  );
};

export default MultiStepProzessItem;
