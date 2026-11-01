"use client";

import { useActionState, useState } from "react";
import { updateProfile } from "@/app/(app)/profile/actions";
import { colleges } from "@/lib/mmsu-programs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Profile = {
  display_name: string;
  college: string | null;
  program: string | null;
  year_level: number | null;
  bio: string | null;
};

const selectClass =
  "h-11 w-full rounded-xl border border-input bg-card px-3 text-base sm:text-sm disabled:cursor-not-allowed disabled:opacity-50";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction, pending] = useActionState(updateProfile, null);

  const initialCollege = colleges.some((c) => c.name === profile.college)
    ? (profile.college as string)
    : "";
  const [college, setCollege] = useState(initialCollege);
  const [program, setProgram] = useState(profile.program ?? "");

  const programs = colleges.find((c) => c.name === college)?.programs ?? [];

  return (
    <form action={formAction} className="space-y-4 surface-card p-6">
      <div className="space-y-2">
        <Label htmlFor="displayName">Display name</Label>
        <Input id="displayName" name="displayName" defaultValue={profile.display_name} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="college">College</Label>
        <select
          id="college"
          name="college"
          value={college}
          onChange={(e) => {
            setCollege(e.target.value);
            setProgram("");
          }}
          className={selectClass}
        >
          <option value="">Select your college</option>
          {colleges.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="program">Degree program</Label>
        <select
          id="program"
          name="program"
          value={program}
          onChange={(e) => setProgram(e.target.value)}
          disabled={!college}
          className={selectClass}
        >
          <option value="">
            {college ? "Select your program" : "Choose a college first"}
          </option>
          {programs.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="yearLevel">Year level</Label>
        <select
          id="yearLevel"
          name="yearLevel"
          defaultValue={profile.year_level?.toString() ?? ""}
          className={selectClass}
        >
          <option value="">Prefer not to say</option>
          {[1, 2, 3, 4].map((y) => (
            <option key={y} value={y}>
              Year {y}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Short introduction</Label>
        <Textarea id="bio" name="bio" rows={4} maxLength={300} defaultValue={profile.bio ?? ""} />
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state?.message && (
        <p role="status" className="text-sm text-primary">
          {state.message}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save profile"}
      </Button>
    </form>
  );
}