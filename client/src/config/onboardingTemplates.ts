import { FeatureKey } from "@/components/dashboard/features/featureMap";

export interface OnboardingTemplate {
  id: string;
  name: string;
  description: string;
  features: FeatureKey[];
  recommendedFor: string[];
}

export const onboardingTemplates: OnboardingTemplate[] = [
  {
    id: "work",
    name: "Work",
    description: "Optimize your professional productivity with deep focus and time management tools",
    features: ["DeepWork", "Tasks", "Pomodoro", "Water"],
    recommendedFor: ["Professional", "Entrepreneur"],
  },
  {
    id: "study",
    name: "Study",
    description: "Build effective study habits with focus tools and progress tracking",
    features: ["Pomodoro", "Tasks", "Mood", "Books", "Water"],
    recommendedFor: ["Student"],
  },
  {
    id: "life",
    name: "Life",
    description: "Balance your wellbeing with mindfulness and self-care practices",
    features: ["Meditation", "Affirmations", "Sleep", "Mood", "Water"],
    recommendedFor: ["Creative", "Other"],
  },
  {
    id: "empty",
    name: "Start Fresh",
    description: "Begin with an empty dashboard and add features as you discover them",
    features: [],
    recommendedFor: [],
  },
];

export function getRecommendedTemplate(
  persona?: string,
  goals?: string[],
  challenge?: string
): string {
  if (!persona) return "empty";

  if (persona === "Student") return "study";
  if (persona === "Professional" || persona === "Entrepreneur") return "work";

  if (goals?.includes("Reduce stress") || goals?.includes("Manage overwhelm")) {
    return "life";
  }

  if (persona === "Creative" || persona === "Other") return "life";

  return "empty";
}
