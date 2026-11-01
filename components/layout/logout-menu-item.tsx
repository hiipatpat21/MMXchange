"use client";

import { logout } from "@/app/(auth)/actions";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function LogoutMenuItem() {
  return (
    <form action={logout}>
      <DropdownMenuItem asChild onSelect={(event) => event.preventDefault()}>
        <button type="submit" className="min-h-11 w-full text-left">Log out</button>
      </DropdownMenuItem>
    </form>
  );
}
