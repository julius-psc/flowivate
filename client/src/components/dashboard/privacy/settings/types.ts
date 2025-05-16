import { Icon } from "lucide-react";

export type Theme = "light" | "dark" | "system";

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface StatusMessage {
  type: "success" | "error" | "info" | null;
  message: string | null;
}

export interface Tab {
  id: string;
  label: string;
  icon: React.ReactElement<typeof Icon>;
}

export interface StylingClasses {
  inputClasses: string;
  labelClasses: string;
  buttonBaseClasses: string;
  buttonPrimaryClasses: string;
  buttonSecondaryClasses: string;
  buttonDangerClasses: string;
  buttonDangerOutlineClasses: string;
  linkButtonPrimaryClasses: string;
  linkButtonSecondaryClasses: string;
  sectionHeaderClasses: string;
  sectionTitleClasses: string;
  sectionDescriptionClasses: string;
}