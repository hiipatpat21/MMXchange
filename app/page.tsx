import { Button } from "@/components/ui/button"
import { Logo } from "@/components/layout/logo"

export default function Home() {
  return (
    <main className = "flex min-h screen flex-col items-center justify-center gap-6">
      <Logo />
      <Button> Primary Button </Button>
      <div className = "rounded-md bg-brand-gold px-4 py-2 text-sm font-medium text-primary">
        Gold Accent
      </div>
    </main>
  );
}
