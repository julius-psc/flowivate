import type { ReactElement } from "react";

export type Theme = "light" | "dark" | "system";

export type TabId = "account" | "appearance" | "subscription" | "danger";

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface StatusMessage {
  type: "success" | "error" | "info" | null;
  message: string | null;
}

export interface Tab {
  id: TabId;
  label: string;
  icon: ReactElement;
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