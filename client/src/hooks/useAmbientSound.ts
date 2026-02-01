import { useAmbientContext } from "@/context/AmbientContext";
export { ambientSoundNames } from "@/context/AmbientContext";
export type { AmbientSoundName } from "@/context/AmbientContext";

export const useAmbientSound = () => {
  return useAmbientContext();
};