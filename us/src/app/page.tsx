import PinGate from "@/components/PinGate";
import StoryExperience from "@/components/StoryExperience";
import { STORY_CONFIG } from "@/lib/story";

export default function Home() {
  return (
    <main className="mx-auto max-w-md">
      <PinGate pin={STORY_CONFIG.pin}>
        <StoryExperience />
      </PinGate>
    </main>
  );
}
