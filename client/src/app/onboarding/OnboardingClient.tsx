"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react";

import Navbar from "@/components/landing-page/Navbar";
import { onboardingTemplates, getRecommendedTemplate } from "@/config/onboardingTemplates";

interface OnboardingData {
  username: string;
  email: string;
  password: string;
  persona: string;
  goals: string[];
  workStyle: string;
  challenge: string;
  template: string;
}

// Steps are now: form, fact, form, fact, form, fact, form, fact, form, fact, form
// 1: Account, 2: Fact, 3: Persona, 4: Fact, 5: Goals, 6: Fact, 7: WorkStyle, 8: Fact, 9: Challenge, 10: Fact, 11: Template
const TOTAL_STEPS = 11;

const facts = [
  { stat: "45%", title: "Increase in focus", description: "Users with structured productivity systems report significantly higher focus levels throughout their workday." },
  { stat: "42%", title: "Higher achievement rates", description: "Personalized goal-setting leads to measurably better outcomes and completion rates." },
  { stat: "30%", title: "Reduction in cognitive load", description: "The right productivity system frees your mind for what truly matters." },
  { stat: "50%", title: "Productivity boost", description: "Aligning your tools with your natural work rhythms amplifies your output." },
  { stat: "60%", title: "Higher success rates", description: "Targeted interventions based on your specific challenges lead to breakthrough results." },
];

// Map: which fact appears after which form step
// After step 1 (account) -> fact 0
// After step 3 (persona) -> fact 1
// After step 5 (goals) -> fact 2
// After step 7 (workstyle) -> fact 3
// After step 9 (challenge) -> fact 4
const getFactIndex = (step: number): number => {
  const factSteps = [2, 4, 6, 8, 10];
  return factSteps.indexOf(step);
};

const isFactStep = (step: number): boolean => {
  return [2, 4, 6, 8, 10].includes(step);
};

export default function OnboardingClient() {
  const { data: session, status } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthUser, setIsOAuthUser] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isChecking, setIsChecking] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      // If already onboarded, don't show the onboarding flow again — go to dashboard
      if (session.user.onboardingCompleted) {
        router.push("/dashboard");
        return;
      }
      setIsOAuthUser(true);
      setCurrentStep(3); // Skip to persona step (step 3)
    }
  }, [status, session, router]);

  const [data, setData] = useState<OnboardingData>({
    username: "",
    email: "",
    password: "",
    persona: "",
    goals: [],
    workStyle: "",
    challenge: "",
    template: "",
  });

  const updateData = (field: keyof OnboardingData, value: string | string[]) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleGoal = (goal: string) => {
    setData((prev) => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter((g) => g !== goal)
        : [...prev.goals, goal],
    }));
  };

  const validateAccountStep = async (): Promise<boolean> => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    // Password Validation
    if (data.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
      isValid = false;
    } else if (!/[A-Z]/.test(data.password)) {
      newErrors.password = "Password must contain at least one uppercase letter";
      isValid = false;
    } else if (!/[a-z]/.test(data.password)) {
      newErrors.password = "Password must contain at least one lowercase letter";
      isValid = false;
    } else if (!/\d/.test(data.password)) {
      newErrors.password = "Password must contain at least one number";
      isValid = false;
    }

    // Username Validation
    if (data.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters long";
      isValid = false;
    }

    // Email Validation
    if (!data.email || !/.+\@.+\..+/.test(data.email)) {
      newErrors.email = "Please enter a valid email address";
      isValid = false;
    }

    if (!isValid) {
      setErrors(newErrors);
      return false;
    }

    // Server-side Availability Check
    setIsChecking(true);
    try {
      const response = await fetch("/api/auth/check-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: data.username, email: data.email }),
      });

      const result = await response.json();

      if (!result.available) {
        if (result.conflicts.username) {
          newErrors.username = result.conflicts.username;
        }
        if (result.conflicts.email) {
          newErrors.email = result.conflicts.email;
        }
        setErrors(newErrors);
        setIsChecking(false);
        return false;
      }
    } catch (error) {
      toast.error("Failed to validate account availability");
      setIsChecking(false);
      return false;
    }

    setIsChecking(false);
    setErrors({});
    return true;
  };

  const handleNext = async () => {
    if (currentStep === 1 && !isOAuthUser) {
      const isValid = await validateAccountStep();
      if (!isValid) return;
    }

    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    const minStep = isOAuthUser ? 3 : 1;
    if (currentStep > minStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSocialSignIn = (provider: string) => {
    signIn(provider, { callbackUrl: "/onboarding" });
  };

  const handleComplete = async () => {
    setIsLoading(true);

    try {
      if (isOAuthUser) {
        const response = await fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            persona: data.persona,
            goals: data.goals,
            workStyle: data.workStyle,
            challenge: data.challenge,
          }),
        });

        if (!response.ok) {
          toast.error("Failed to complete onboarding. Please try again.");
          setIsLoading(false);
          return;
        }

        if (data.template && data.template !== "empty") {
          const selectedTemplate = onboardingTemplates.find(t => t.id === data.template);
          if (selectedTemplate && selectedTemplate.features.length > 0) {
            await fetch("/api/layout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ features: selectedTemplate.features }),
            });
          }
        }

        toast.success("Welcome to Flowivate!");
        router.push("/dashboard");
      } else {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: data.email,
            username: data.username,
            password: data.password,
            persona: data.persona,
            goals: data.goals,
            workStyle: data.workStyle,
            challenge: data.challenge,
            onboardingCompleted: true,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          toast.error(result.error || "Registration failed. Please try again.");
          setIsLoading(false);
          return;
        }

        const signInResult = await signIn("credentials", {
          redirect: false,
          email: data.email,
          password: data.password,
        });

        if (signInResult?.error) {
          toast.error("Login failed. Please try logging in manually.");
          router.push("/login");
          return;
        }

        if (data.template && data.template !== "empty") {
          const selectedTemplate = onboardingTemplates.find(t => t.id === data.template);
          if (selectedTemplate && selectedTemplate.features.length > 0) {
            await fetch("/api/layout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ features: selectedTemplate.features }),
            });
          }
        }

        toast.success("Welcome to Flowivate!");
        router.push("/dashboard");
      }
    } catch (err) {
      toast.error("An unexpected error occurred.");
      console.error("Onboarding error:", err);
    }

    setIsLoading(false);
  };

  const canProceed = () => {
    // Fact steps can always proceed
    if (isFactStep(currentStep)) return true;

    switch (currentStep) {
      case 1: // Account
        return data.username && data.email && data.password.length >= 6;
      case 3: // Persona
        return data.persona !== "";
      case 5: // Goals
        return data.goals.length > 0;
      case 7: // WorkStyle
        return data.workStyle !== "";
      case 9: // Challenge
        return data.challenge !== "";
      case 11: // Template
        return data.template !== "";
      default:
        return true;
    }
  };

  const recommendedTemplateId = getRecommendedTemplate(
    data.persona,
    data.goals,
    data.challenge
  );

  // Calculate progress (form steps only for visual)
  const formStepNumber = Math.ceil(currentStep / 2);
  const totalFormSteps = 6;

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 pt-28 pb-8">
        <div className="w-full max-w-[420px] flex flex-col items-center">
          {/* Progress Bar */}
          <div className="w-full mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-[#666666]">Step {formStepNumber} of {totalFormSteps}</span>
              <span className="text-xs text-[#666666]">{Math.round((formStepNumber / totalFormSteps) * 100)}%</span>
            </div>
            <div className="w-full bg-[#2a2a2a] h-1 rounded-full overflow-hidden">
              <div
                className="bg-primary-blue h-full rounded-full transition-all duration-500"
                style={{ width: `${(formStepNumber / totalFormSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Content */}
          <div key={currentStep} className="w-full">
            {currentStep === 1 && (
              <Step1Account
                data={data}
                updateData={updateData}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                handleSocialSignIn={handleSocialSignIn}
                isLoading={isLoading}
                errors={errors}
                setErrors={setErrors}
              />
            )}
            {currentStep === 2 && <FactStep fact={facts[0]} />}
            {currentStep === 3 && <Step2Persona data={data} updateData={updateData} />}
            {currentStep === 4 && <FactStep fact={facts[1]} />}
            {currentStep === 5 && <Step3Goals data={data} toggleGoal={toggleGoal} />}
            {currentStep === 6 && <FactStep fact={facts[2]} />}
            {currentStep === 7 && <Step4WorkStyle data={data} updateData={updateData} />}
            {currentStep === 8 && <FactStep fact={facts[3]} />}
            {currentStep === 9 && <Step5Challenge data={data} updateData={updateData} />}
            {currentStep === 10 && <FactStep fact={facts[4]} />}
            {currentStep === 11 && <Step6Template data={data} updateData={updateData} recommendedTemplateId={recommendedTemplateId} />}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6 w-full pt-4 border-t border-[#2a2a2a]">
            {currentStep > (isOAuthUser ? 3 : 1) ? (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[#999999] hover:text-white transition-colors text-sm font-medium"
              >
                <ArrowLeft size={16} />
                Back
              </button>
            ) : (
              <div></div>
            )}
            {currentStep < TOTAL_STEPS ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-blue hover:bg-primary-blue/90 text-white font-medium transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed text-sm"
              >
                {isChecking ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Checking...
                  </div>
                ) : (
                  <>
                    Continue
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={!canProceed() || isLoading}
                className="px-6 py-2.5 rounded-lg bg-primary-blue hover:bg-primary-blue/90 text-white font-medium transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Setting up...
                  </div>
                ) : (
                  "Complete Setup"
                )}
              </button>
            )}
          </div>

          {/* Login Link */}
          <div className="mt-6 text-center text-sm text-[#666666]">
            Already have an account?{" "}
            <Link href="/login" className="text-primary-blue hover:text-primary-blue/90 transition-colors">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Fact Step Component - its own dedicated step
function FactStep({ fact }: { fact: { stat: string; title: string; description: string } }) {
  return (
    <div className="text-center py-8">
      <div className="text-5xl font-bold text-primary-blue mb-3">{fact.stat}</div>
      <h2 className="text-xl font-semibold text-white mb-3">{fact.title}</h2>
      <p className="text-sm text-[#888888] max-w-sm mx-auto leading-relaxed">{fact.description}</p>
    </div>
  );
}

function Step1Account({
  data,
  updateData,
  showPassword,
  setShowPassword,
  handleSocialSignIn,
  isLoading,
  errors,
  setErrors
}: {
  data: OnboardingData;
  updateData: (field: keyof OnboardingData, value: string) => void;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  handleSocialSignIn: (provider: string) => void;
  isLoading: boolean;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
}) {
  const handleChange = (field: keyof OnboardingData, value: string) => {
    updateData(field, value);
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-[22px] font-semibold text-white mb-1 tracking-tight">Get started</h2>
        <p className="text-sm text-[#666666]">Create your account to begin</p>
      </div>

      {/* Social Auth */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => handleSocialSignIn("github")}
          disabled={isLoading}
          className="flex-1 h-11 flex items-center justify-center bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:bg-[#222222] hover:border-[#333333] transition-all duration-200 disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
        </button>
        <button
          onClick={() => handleSocialSignIn("google")}
          disabled={isLoading}
          className="flex-1 h-11 flex items-center justify-center bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:bg-[#222222] hover:border-[#333333] transition-all duration-200 disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center mb-4">
        <div className="flex-1 h-px bg-[#2a2a2a]"></div>
        <span className="px-4 text-sm text-[#666666]">or</span>
        <div className="flex-1 h-px bg-[#2a2a2a]"></div>
      </div>

      {/* Form Fields */}
      <div className="space-y-3">
        <div>
          <input
            id="username"
            type="text"
            value={data.username}
            onChange={(e) => handleChange("username", e.target.value)}
            placeholder="Username"
            className={`w-full h-11 px-4 bg-[#1a1a1a] border rounded-lg text-white placeholder-[#666666] focus:outline-none transition-colors duration-200 ${errors.username ? "border-red-500 focus:border-red-500" : "border-[#2a2a2a] focus:border-primary-blue"
              }`}
            required
          />
          {errors.username && <p className="text-red-500 text-xs mt-1 ml-1">{errors.username}</p>}
        </div>

        <div>
          <input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="Email address"
            className={`w-full h-11 px-4 bg-[#1a1a1a] border rounded-lg text-white placeholder-[#666666] focus:outline-none transition-colors duration-200 ${errors.email ? "border-red-500 focus:border-red-500" : "border-[#2a2a2a] focus:border-primary-blue"
              }`}
            required
          />
          {errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{errors.email}</p>}
        </div>

        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={data.password}
            onChange={(e) => handleChange("password", e.target.value)}
            placeholder="Password (min 8 characters)"
            className={`w-full h-11 px-4 pr-11 bg-[#1a1a1a] border rounded-lg text-white placeholder-[#666666] focus:outline-none transition-colors duration-200 ${errors.password ? "border-red-500 focus:border-red-500" : "border-[#2a2a2a] focus:border-primary-blue"
              }`}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] hover:text-white transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && <p className="text-red-500 text-xs mt-1 ml-1">{errors.password}</p>}
      </div>
    </div>
  );
}

function Step2Persona({ data, updateData }: {
  data: OnboardingData;
  updateData: (field: keyof OnboardingData, value: string) => void;
}) {
  const personas = ["Student", "Professional", "Entrepreneur", "Creative", "Other"];

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-[22px] font-semibold text-white mb-1 tracking-tight">Who are you?</h2>
        <p className="text-sm text-[#666666]">This helps us personalize your experience</p>
      </div>

      <div className="space-y-2">
        {personas.map((persona) => (
          <button
            key={persona}
            onClick={() => updateData("persona", persona)}
            className={`w-full p-3.5 rounded-lg border transition-all duration-200 text-left ${data.persona === persona
              ? "border-primary-blue bg-primary-blue/10 text-white"
              : "border-[#2a2a2a] bg-[#1a1a1a] text-[#999999] hover:border-[#333333] hover:text-white"
              }`}
          >
            <span className="font-medium text-sm">{persona}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Step3Goals({ data, toggleGoal }: {
  data: OnboardingData;
  toggleGoal: (goal: string) => void;
}) {
  const goals = [
    "Improve focus",
    "Build habits",
    "Track progress",
    "Reduce stress",
    "Manage time",
    "Stay organized",
  ];

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-[22px] font-semibold text-white mb-1 tracking-tight">What brings you here?</h2>
        <p className="text-sm text-[#666666]">Select all that apply</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {goals.map((goal) => (
          <button
            key={goal}
            onClick={() => toggleGoal(goal)}
            className={`p-3.5 rounded-lg border transition-all duration-200 text-left ${data.goals.includes(goal)
              ? "border-primary-blue bg-primary-blue/10 text-white"
              : "border-[#2a2a2a] bg-[#1a1a1a] text-[#999999] hover:border-[#333333] hover:text-white"
              }`}
          >
            <span className="font-medium text-sm">{goal}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Step4WorkStyle({ data, updateData }: {
  data: OnboardingData;
  updateData: (field: keyof OnboardingData, value: string) => void;
}) {
  const workStyles = [
    { value: "deep", label: "Deep focused sessions", description: "Long uninterrupted blocks of concentration" },
    { value: "bursts", label: "Short bursts with breaks", description: "Pomodoro-style work intervals" },
    { value: "flexible", label: "Flexible throughout day", description: "Adapt to changing priorities" },
  ];

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-[22px] font-semibold text-white mb-1 tracking-tight">How do you work best?</h2>
        <p className="text-sm text-[#666666]">Understanding your rhythm</p>
      </div>

      <div className="space-y-2">
        {workStyles.map((style) => (
          <button
            key={style.value}
            onClick={() => updateData("workStyle", style.value)}
            className={`w-full p-4 rounded-lg border transition-all duration-200 text-left ${data.workStyle === style.value
              ? "border-primary-blue bg-primary-blue/10"
              : "border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#333333]"
              }`}
          >
            <div className="font-medium text-white text-sm">{style.label}</div>
            <div className="text-xs text-[#666666] mt-1">{style.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Step5Challenge({ data, updateData }: {
  data: OnboardingData;
  updateData: (field: keyof OnboardingData, value: string) => void;
}) {
  const challenges = [
    { value: "focus", label: "Staying focused", description: "Getting distracted easily" },
    { value: "consistency", label: "Building consistency", description: "Following through on habits" },
    { value: "overwhelm", label: "Managing overwhelm", description: "Too much on my plate" },
    { value: "tracking", label: "Tracking goals", description: "Losing sight of progress" },
  ];

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-[22px] font-semibold text-white mb-1 tracking-tight">What&apos;s your biggest challenge?</h2>
        <p className="text-sm text-[#666666]">We&apos;ll help you address it</p>
      </div>

      <div className="space-y-2">
        {challenges.map((challenge) => (
          <button
            key={challenge.value}
            onClick={() => updateData("challenge", challenge.value)}
            className={`w-full p-4 rounded-lg border transition-all duration-200 text-left ${data.challenge === challenge.value
              ? "border-primary-blue bg-primary-blue/10"
              : "border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#333333]"
              }`}
          >
            <div className="font-medium text-white text-sm">{challenge.label}</div>
            <div className="text-xs text-[#666666] mt-1">{challenge.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Step6Template({ data, updateData, recommendedTemplateId }: {
  data: OnboardingData;
  updateData: (field: keyof OnboardingData, value: string) => void;
  recommendedTemplateId: string;
}) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-[22px] font-semibold text-white mb-1 tracking-tight">Choose your starting template</h2>
        <p className="text-sm text-[#666666]">You can customize anytime</p>
      </div>

      <div className="space-y-2">
        {onboardingTemplates.map((template) => {
          const isRecommended = template.id === recommendedTemplateId;

          return (
            <button
              key={template.id}
              onClick={() => updateData("template", template.id)}
              className={`w-full p-4 rounded-lg border transition-all duration-200 text-left relative ${data.template === template.id
                ? "border-primary-blue bg-primary-blue/10"
                : "border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#333333]"
                }`}
            >
              {isRecommended && (
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-primary-blue/20 border border-primary-blue/40 text-xs text-primary-blue font-medium">
                  Recommended
                </div>
              )}
              <div className="font-semibold text-white mb-1">{template.name}</div>
              <div className="text-xs text-[#666666] mb-2">{template.description}</div>
              {template.features.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {template.features.map((feature) => (
                    <span
                      key={feature}
                      className="px-2 py-0.5 rounded bg-[#2a2a2a] border border-[#333333] text-xs text-[#999999]"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
