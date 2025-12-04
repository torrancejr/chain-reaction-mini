"use client";

import { useState } from "react";
import styles from "./Onboarding.module.css";

interface OnboardingProps {
  onComplete: () => void;
}

interface OnboardingStep {
  icon: string;
  title: string;
  description: string;
  isFollowStep?: boolean;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    icon: "⛓️",
    title: "Welcome to Chain Reaction!",
    description: "A social domino game where you build chains and claim pots. Risk vs reward – who blinks first?",
  },
  {
    icon: "🀱",
    title: "Place Dominoes",
    description: "You start with 100 points daily. Spend 10 to add a domino to the chain – every domino adds to the pot!",
  },
  {
    icon: "💥",
    title: "Break the Chain",
    description: "Break at 3+ dominoes to score! The pot becomes your leaderboard score. Points don't refund – spend wisely!",
  },
  {
    icon: "⚡",
    title: "Power Dominoes",
    description: "Every 7th domino triggers a power-up! Double Down, Shockwave, Bomb, or Reverse – each changes the game.",
  },
  {
    icon: "🏆",
    title: "Weekly Leaderboard",
    description: "Your biggest pot win counts! Top the weekly leaderboard and win the airdrop prize.",
  },
  {
    icon: "🔔",
    title: "Follow Us",
    description: "Follow @chainintelio on Farcaster to unlock the game and stay updated with announcements!",
    isFollowStep: true,
  },
];

const FARCASTER_FOLLOW_URL = "https://warpcast.com/chainintelio";
const STORAGE_KEY = "chain-reaction-onboarding-complete";

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followClicked, setFollowClicked] = useState(false);

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      // Complete onboarding
      localStorage.setItem(STORAGE_KEY, "true");
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleFollow = () => {
    window.open(FARCASTER_FOLLOW_URL, "_blank");
    setFollowClicked(true);
    // Auto-enable proceed after clicking follow (trust-based)
    setTimeout(() => setIsFollowing(true), 1000);
  };

  const canProceed = !step.isFollowStep || isFollowing;

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        {/* Progress Bar */}
        <div className={styles.progressContainer}>
          {ONBOARDING_STEPS.map((_, index) => (
            <div
              key={index}
              className={`${styles.progressSegment} ${index <= currentStep ? styles.active : ""}`}
            />
          ))}
        </div>

        {/* Content */}
        <div className={styles.content}>
          <div className={styles.iconWrapper}>
            <span className={styles.icon}>{step.icon}</span>
          </div>

          <h2 className={styles.title}>{step.title}</h2>
          <p className={styles.description}>{step.description}</p>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          {step.isFollowStep && (
            <>
              {!isFollowing && (
                <div className={styles.followNotice}>
                  <span className={styles.infoIcon}>ℹ️</span>
                  <span>You must follow @chainintelio to proceed!</span>
                </div>
              )}
              <button
                className={styles.followButton}
                onClick={handleFollow}
                disabled={followClicked && isFollowing}
              >
                {isFollowing ? "✓ Following" : "Follow @chainintelio"}
              </button>
            </>
          )}

          <button
            className={`${styles.proceedButton} ${!canProceed ? styles.disabled : ""}`}
            onClick={handleNext}
            disabled={!canProceed}
          >
            {isLastStep ? "Proceed" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

