import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { trustedAvatarUrl } from "@/lib/avatars";

export function StudentAvatar({ name, url, className = "size-12" }: { name: string; url?: string | null; className?: string }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
  const src = trustedAvatarUrl(url);
  return <Avatar className={className}>
    {src && <AvatarImage src={src} alt={`${name}'s profile photo`} />}
    <AvatarFallback className="bg-primary/10 font-semibold text-primary">{initials}</AvatarFallback>
  </Avatar>;
}
