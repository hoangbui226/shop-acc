import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const tutorialData = {
  ios: {
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    steps: [
      {
        title: "Step 1: Download the App",
        description:
          "Go to the App Store on your iPhone or iPad. Search for the application and tap 'Get' to download and install it on your device.",
      },
      {
        title: "Step 2: Create Your Account",
        description:
          "Open the app and tap 'Sign Up'. Fill in your details including email and password, then verify your email address to activate your account.",
      },
      {
        title: "Step 3: Get Your Token",
        description:
          "Navigate to Settings > Account > Token. Tap 'Copy Token' to copy it to your clipboard. You will use this token in the Checagem de Limites tool.",
      },
      {
        title: "Step 4: Check Your Limits",
        description:
          "Paste your token into the input field on the main page and click 'Consultar'. Your available recharges and diamond history will be displayed.",
      },
    ],
  },
  adr: {
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    steps: [
      {
        title: "Step 1: Install the APK",
        description:
          "Download the APK file from the official website. Go to Settings > Security and enable 'Unknown Sources', then install the APK.",
      },
      {
        title: "Step 2: Register Your Account",
        description:
          "Launch the app and tap 'Register'. Enter your email, create a strong password, and complete the verification process.",
      },
      {
        title: "Step 3: Retrieve Your Token",
        description:
          "Open the side menu and go to Profile > Token Management. Tap 'Generate Token' and copy the generated token to your clipboard.",
      },
      {
        title: "Step 4: Verify Your Limits",
        description:
          "Go back to the Checagem de Limites page, paste your token, and press 'Consultar' to see your available recharges and diamond usage.",
      },
    ],
  },
};

interface TutorialModalProps {
  open: boolean;
  onClose: () => void;
}

const TutorialModal = ({ open, onClose }: TutorialModalProps) => {
  const [platform, setPlatform] = useState<"ios" | "adr">("ios");

  if (!open) return null;

  const data = tutorialData[platform];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl bg-card border border-border shadow-2xl shadow-black/50">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="p-6 sm:p-8">
          <h2 className="text-xl font-bold text-foreground mb-6">Tutorial</h2>

          {/* Platform toggle */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={platform === "ios" ? "default" : "outline"}
              size="sm"
              onClick={() => setPlatform("ios")}
              className="min-w-[5rem]"
            >
              IOS
            </Button>
            <Button
              variant={platform === "adr" ? "default" : "outline"}
              size="sm"
              onClick={() => setPlatform("adr")}
              className="min-w-[5rem]"
            >
              ADR
            </Button>
          </div>

          {/* Video */}
          <div className="aspect-video w-full rounded-lg overflow-hidden border border-border mb-8">
            <iframe
              key={platform}
              src={data.videoUrl}
              title={`${platform.toUpperCase()} Tutorial`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Steps */}
          <div className="space-y-6">
            {data.steps.map((step, i) => (
              <div key={i}>
                <h3 className="text-base font-semibold text-foreground mb-1">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialModal;
