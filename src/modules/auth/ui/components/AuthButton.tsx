interface AuthButtonProps {
  Icon: React.ComponentType<{ size?: number }>;
  label: string;
}

const AuthButton: React.FC<AuthButtonProps> = ({ Icon, label }) => {
  return (
    <div className="flex gap-2 py-2 px-3 items-center justify-center rounded-xl border-1 border-blue text-blue w-full sm:w-fit cursor-pointer hover:scale-105 transition-all">
      <Icon size={20} />
      <p className="ml-2 mt-1">{label}</p>
    </div>
  );
};

export default AuthButton;
