import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import StoryExperience from "@/components/story/StoryExperience";

// A warm serif for headings — earthy and personal.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "For you",
  // Private surprise — keep it out of search engines.
  robots: { index: false, follow: false },
};

export default function UsPage() {
  return (
    <div className={`${fraunces.variable} min-h-[100dvh] bg-[#FBF5F2]`}>
      <StoryExperience />
    </div>
  );
}
