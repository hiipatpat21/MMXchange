import { Logo } from "@/components/layout/logo";
import { logout } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background">
    <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-8">
      <Logo /><form action={logout}><Button variant="ghost" type="submit">Log out</Button></form>
    </header>
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl px-4 pb-12 pt-4 outline-none sm:px-8">{children}</main>
  </div>;
}
