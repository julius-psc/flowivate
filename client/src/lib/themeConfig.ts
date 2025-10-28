export const themeConfigs = [
  {
    name: "default",
    color: "#0075C4",
    label: "Default",
    bgUrl: "/assets/illustrations/gradient-bg-blue.svg",
  },
  {
    name: "forest",
    color: "#48AC5C",
    label: "Forest",
    bgUrl: "/assets/illustrations/gradient-bg-forest.svg",
  },
  {
    name: "candy",
    color: "#f9a8d4",
    label: "Candy",
    bgUrl: "/assets/illustrations/gradient-bg-candy.svg",
  },
  {
    name: "sunset",
    color: "#FF7043",
    label: "Sunset",
    bgUrl: "/assets/illustrations/gradient-bg-sunset.svg",
  },
  {
    name: "teal",
    color: "#26A69A",
    label: "Teal",
    bgUrl: "/assets/illustrations/gradient-bg-teal.svg",
  },
  {
    name: "desert",
    color: "#FFB74D",
    label: "Desert",
    bgUrl: "/assets/illustrations/gradient-bg-desert.svg",
  },
] as const;

export const specialSceneThemes = [
  {
    name: "jungle",
    color: "#81C784",
    label: "Jungle",
  },
  {
    name: "ocean",
    color: "#26A69A",
    label: "Ocean",
  },
] as const;

export const specialSceneThemeNames = specialSceneThemes.map(
  (t) => t.name
) as readonly ((typeof specialSceneThemes)[number]["name"])[];

export type ThemeName =
  | (typeof themeConfigs)[number]["name"]
  | (typeof specialSceneThemes)[number]["name"];