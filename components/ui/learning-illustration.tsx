import Image from "next/image";
import { cn } from "@/lib/utils";

const illustrations = {
  exchange: { src: "/illustrations/skill-exchange.webp", width: 1100, height: 825 },
  group: { src: "/illustrations/group-learning.webp", width: 1100, height: 825 },
  curious: { src: "/illustrations/curious-student.webp", width: 600, height: 600 },
};
export type LearningScene = keyof typeof illustrations;

/** Decorative art stays silent for screen readers; meaningful scenes receive alt text. */
export function LearningIllustration({ scene, alt = "", className, priority = false, sizes = "160px" }: {
  scene: LearningScene; alt?: string; className?: string; priority?: boolean; sizes?: string;
}) {
  return <Image {...illustrations[scene]} alt={alt} aria-hidden={alt ? undefined : true}
    className={cn("h-auto object-contain", className)} sizes={sizes} priority={priority} unoptimized />;
}
