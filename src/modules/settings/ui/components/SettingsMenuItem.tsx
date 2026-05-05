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
      className="border border-gray-200 rounded-xl p-5 bg-white flex items-center gap-4 hover:border-gray-300 hover:shadow-sm transition-all group"
    >
      <div className="bg-gray-100 rounded-lg p-2.5 group-hover:bg-gray-200 transition-colors">
        <Icon size={18} className="text-gray-700" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 text-sm">{name}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5 truncate">{description}</p>}
      </div>
      <ChevronRight
        size={16}
        className="text-gray-400 group-hover:text-gray-600 transition-colors shrink-0"
      />
    </Link>
  );
};

export default SettingsMenuItem;
