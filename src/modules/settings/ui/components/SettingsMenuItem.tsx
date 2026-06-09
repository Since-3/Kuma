import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";

interface SettingsMenuItemProps {
  name: string;
  description?: string;
  icon: LucideIcon;
  href: string;
}

const SettingsMenuItem: React.FC<SettingsMenuItemProps> = ({
  name,
  description,
  icon: Icon,
  href,
}) => {
  return (
    <Link
      href={href}
      className="border border-white/60 bg-white/55 backdrop-blur-xl rounded-xl p-5 flex items-center gap-4 hover:bg-white/75 hover:shadow-sm transition-all group"
    >
      <div className="bg-white/60 rounded-xl p-2.5 group-hover:bg-white/80 transition-colors border border-white/50">
        <Icon size={18} className="text-blue" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm">{name}</p>
        {description && (
          <p className="text-xs text-gray-400 font-light mt-0.5 truncate">{description}</p>
        )}
      </div>
      <ChevronRight
        size={16}
        className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all shrink-0"
      />
    </Link>
  );
};

export default SettingsMenuItem;
