import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/layout/logo";
import { NavLinks } from "@/components/layout/nav-links";
import { logout } from "@/app/(auth)/actions";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export function Topbar({ displayName }: { displayName: string }) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-4">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="mt-6 flex flex-col gap-6">
            <Logo />
            <NavLinks />
          </div>
        </SheetContent>
      </Sheet>

      <div className="hidden md:block" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="rounded-full p-0" aria-label="Account menu">
            <Avatar>
              <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{displayName}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/profile">My Profile</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/skills">My Skills</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <form action={logout}>
              <button type="submit" className="w-full text-left">
                Log out
              </button>
            </form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}