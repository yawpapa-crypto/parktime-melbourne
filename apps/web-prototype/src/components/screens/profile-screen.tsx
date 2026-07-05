import {
  Bell,
  Camera,
  Car,
  ChevronRight,
  Clock,
  Database,
  Eye,
  Flag,
  HelpCircle,
  Map,
  MapPin,
  Shield,
  Star,
  User,
  Zap,
} from "lucide-react";

interface ProfileScreenProps {
  onOpenScanner: () => void;
}

interface ProfileItem {
  icon: React.ReactNode;
  label: string;
  value: string;
  action?: () => void;
}

interface ProfileSection {
  title: string;
  items: ProfileItem[];
}

export function ProfileScreen({ onOpenScanner }: ProfileScreenProps) {
  const sections: ProfileSection[] = [
    {
      title: "Vehicle",
      items: [
        { icon: <Car size={16} aria-hidden="true" />, label: "Saved vehicles", value: "1ABC 123" },
        { icon: <Star size={16} aria-hidden="true" />, label: "Default registration", value: "1ABC 123" },
      ],
    },
    {
      title: "Preferences",
      items: [
        { icon: <Bell size={16} aria-hidden="true" />, label: "Notification settings", value: "" },
        { icon: <Clock size={16} aria-hidden="true" />, label: "Preferred duration", value: "2P" },
        { icon: <User size={16} aria-hidden="true" />, label: "Accessible parking", value: "Off" },
      ],
    },
    {
      title: "Tools",
      items: [
        { icon: <Camera size={16} aria-hidden="true" />, label: "Sign scanner", value: "", action: onOpenScanner },
        { icon: <Zap size={16} aria-hidden="true" />, label: "Electric vehicle charging", value: "Off" },
      ],
    },
    {
      title: "Map & Data",
      items: [
        { icon: <Map size={16} aria-hidden="true" />, label: "Map appearance", value: "Default" },
        { icon: <Eye size={16} aria-hidden="true" />, label: "Colour-blind mode", value: "Off" },
        { icon: <Database size={16} aria-hidden="true" />, label: "Data sources", value: "" },
        { icon: <Shield size={16} aria-hidden="true" />, label: "Privacy", value: "" },
        { icon: <MapPin size={16} aria-hidden="true" />, label: "Council coverage", value: "7 councils" },
      ],
    },
    {
      title: "Support",
      items: [
        { icon: <HelpCircle size={16} aria-hidden="true" />, label: "Help and feedback", value: "" },
        { icon: <Flag size={16} aria-hidden="true" />, label: "Report an issue", value: "" },
      ],
    },
  ];

  return (
    <section className="flex-1 flex flex-col bg-[#F7F9FC] overflow-hidden" aria-label="Profile">
      <header className="bg-white px-5 pt-3 pb-5 border-b border-black/5 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center" aria-hidden="true">
            <User size={24} className="text-white" />
          </div>
          <div>
            <div className="text-[17px] font-semibold text-[#111827]">Alex Mitchell</div>
            <div className="text-[13px] text-gray-400">Melbourne, VIC</div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 no-scrollbar">
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2">
              {section.title}
            </h2>
            <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
              {section.items.map((item, i) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.action}
                  className={`w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring active:bg-gray-50 transition-colors ${
                    i < section.items.length - 1 ? "border-b border-black/5" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-primary">
                      {item.icon}
                    </div>
                    <span className="text-[14px] text-[#111827]">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.value && <span className="text-[13px] text-gray-400">{item.value}</span>}
                    <ChevronRight size={16} className="text-gray-300" aria-hidden="true" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
        <footer className="pb-4 text-center space-y-0.5">
          <div className="text-[11px] text-gray-400">ParkTime Melbourne v1.0</div>
          <div className="text-[11px] text-gray-400">City of Melbourne · VicRoads · 7 councils</div>
        </footer>
      </div>
    </section>
  );
}
