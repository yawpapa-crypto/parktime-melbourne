import { useState } from "react";
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
import { useAppStore } from "@/context/app-store";
import { ToggleSwitch } from "@/components/ui/icon-button";

interface ProfileScreenProps {
  onOpenScanner: () => void;
}

type EditField = "name" | "location" | "vehicle" | "duration" | null;

export function ProfileScreen({ onOpenScanner }: ProfileScreenProps) {
  const { profile, updateProfile, councilCount } = useAppStore();
  const [editField, setEditField] = useState<EditField>(null);
  const [draft, setDraft] = useState("");

  const openEdit = (field: EditField, value: string) => {
    setEditField(field);
    setDraft(value);
  };

  const saveEdit = () => {
    if (editField === "name") updateProfile({ name: draft.trim() || profile.name });
    if (editField === "location") updateProfile({ location: draft.trim() || profile.location });
    if (editField === "vehicle") {
      const plate = draft.trim().toUpperCase();
      if (plate && !profile.vehicles.includes(plate)) {
        updateProfile({ vehicles: [...profile.vehicles, plate], defaultVehicle: profile.defaultVehicle || plate });
      }
    }
    if (editField === "duration") updateProfile({ preferredDuration: draft.trim() || profile.preferredDuration });
    setEditField(null);
  };

  const sections = [
    {
      title: "Vehicle",
      items: [
        {
          icon: <Car size={16} />,
          label: "Saved vehicles",
          value: profile.vehicles.join(", ") || "None",
          action: () => openEdit("vehicle", ""),
        },
        {
          icon: <Star size={16} />,
          label: "Default registration",
          value: profile.defaultVehicle,
          action: () => {
            if (profile.vehicles.length > 1) {
              const idx = profile.vehicles.indexOf(profile.defaultVehicle);
              updateProfile({ defaultVehicle: profile.vehicles[(idx + 1) % profile.vehicles.length] });
            }
          },
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          icon: <Bell size={16} />,
          label: "Notifications",
          toggle: true,
          checked: profile.notificationsEnabled,
          onToggle: (v: boolean) => updateProfile({ notificationsEnabled: v }),
        },
        {
          icon: <Clock size={16} />,
          label: "Preferred duration",
          value: profile.preferredDuration,
          action: () => openEdit("duration", profile.preferredDuration),
        },
        {
          icon: <User size={16} />,
          label: "Accessible parking",
          toggle: true,
          checked: profile.accessibleParking,
          onToggle: (v: boolean) => updateProfile({ accessibleParking: v }),
        },
      ],
    },
    {
      title: "Tools",
      items: [
        { icon: <Camera size={16} />, label: "Sign scanner", value: "", action: onOpenScanner },
        {
          icon: <Zap size={16} />,
          label: "Electric vehicle charging",
          toggle: true,
          checked: profile.evCharging,
          onToggle: (v: boolean) => updateProfile({ evCharging: v }),
        },
      ],
    },
    {
      title: "Map & Data",
      items: [
        {
          icon: <Map size={16} />,
          label: "Map appearance",
          value: profile.mapAppearance === "default" ? "Default" : "Satellite",
          action: () =>
            updateProfile({
              mapAppearance: profile.mapAppearance === "default" ? "satellite" : "default",
            }),
        },
        {
          icon: <Eye size={16} />,
          label: "Colour-blind mode",
          toggle: true,
          checked: profile.colorBlindMode,
          onToggle: (v: boolean) => updateProfile({ colorBlindMode: v }),
        },
        { icon: <Database size={16} />, label: "Data sources", value: "Melbourne ODS" },
        { icon: <Shield size={16} />, label: "Privacy", value: "Local device storage" },
        {
          icon: <MapPin size={16} />,
          label: "Council coverage",
          value: councilCount != null ? `${councilCount} councils` : "Loading…",
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          icon: <HelpCircle size={16} />,
          label: "Help and feedback",
          action: () => window.open("mailto:support@parktime.app?subject=ParkTime%20Melbourne%20feedback"),
        },
        {
          icon: <Flag size={16} />,
          label: "Report an issue",
          action: () => window.open("mailto:support@parktime.app?subject=ParkTime%20app%20issue"),
        },
      ],
    },
  ];

  return (
    <section className="flex-1 flex flex-col bg-[#F7F9FC] overflow-hidden" aria-label="Profile">
      <header className="bg-white px-5 pt-3 pb-5 border-b border-black/5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
            <User size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <button type="button" onClick={() => openEdit("name", profile.name)} className="text-left">
              <div className="text-[17px] font-semibold text-[#111827]">{profile.name}</div>
            </button>
            <button type="button" onClick={() => openEdit("location", profile.location)} className="text-left">
              <div className="text-[13px] text-gray-400">{profile.location}</div>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 no-scrollbar">
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2">{section.title}</h2>
            <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
              {section.items.map((item, i) => (
                <div
                  key={item.label}
                  className={`flex items-center justify-between px-4 py-3.5 ${i < section.items.length - 1 ? "border-b border-black/5" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-primary">{item.icon}</div>
                    <span className="text-[14px] text-[#111827]">{item.label}</span>
                  </div>
                  {"toggle" in item && item.toggle ? (
                    <ToggleSwitch label={item.label} checked={item.checked!} onChange={item.onToggle!} />
                  ) : (
                    <button type="button" onClick={"action" in item ? item.action : undefined} className="flex items-center gap-2 text-[13px] text-gray-400">
                      {"value" in item && item.value ? <span>{item.value}</span> : null}
                      <ChevronRight size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {editField && (
        <div className="absolute inset-0 z-50 flex items-end bg-black/30">
          <div className="w-full bg-white rounded-t-3xl p-5 space-y-4">
            <h3 className="text-[17px] font-semibold">
              {editField === "name" && "Edit name"}
              {editField === "location" && "Edit location"}
              {editField === "vehicle" && "Add vehicle"}
              {editField === "duration" && "Preferred duration"}
            </h3>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={editField === "vehicle" ? "e.g. 1ABC123" : ""}
              className="w-full rounded-xl border px-4 py-3 text-[15px] outline-none focus:border-primary"
              autoFocus
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditField(null)} className="flex-1 py-3 rounded-xl border text-[14px]">Cancel</button>
              <button type="button" onClick={saveEdit} className="flex-1 py-3 rounded-xl bg-primary text-white text-[14px] font-semibold">Save</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
