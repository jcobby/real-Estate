"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { RequireRole } from "@/components/auth/require-role";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useSession } from "@/stores/session";

export default function SettingsPage() {
  return (
    <RequireRole>
      <SettingsGate />
    </RequireRole>
  );
}

/** Remounts the form whenever the demo user changes, so state re-initialises cleanly. */
function SettingsGate() {
  const { session } = useSession();
  return <SettingsContent key={session!.user.id} />;
}

function SettingsContent() {
  const router = useRouter();
  const { session, setSession, signOut } = useSession();
  const user = session!.user;

  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [region, setRegion] = useState(user.region);
  const [alerts, setAlerts] = useState({ messages: true, priceDrops: true, escrow: true, marketing: false });

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }
    setSession({ ...session!, user: { ...user, name: name.trim(), phone, region } });
    toast.success("Profile updated");
  };

  return (
    <main className="page-container max-w-3xl py-10">
      <h1 className="font-heading text-2xl font-bold tracking-tight">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">Manage your profile, appearance and notifications.</p>

      <Card className="mt-6 gap-5 rounded-2xl p-6">
        <h2 className="font-heading text-base font-semibold">Profile</h2>
        <form onSubmit={saveProfile} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="set-name">Full name</Label>
            <Input id="set-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="set-email">Email</Label>
            <Input id="set-email" value={user.email} disabled />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="set-phone">Phone</Label>
            <Input id="set-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="set-region">Region</Label>
            <Input id="set-region" value={region} onChange={(e) => setRegion(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      </Card>

      <Card className="mt-5 gap-4 rounded-2xl p-6">
        <h2 className="font-heading text-base font-semibold">Appearance</h2>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Switch between light and dark mode.</p>
          <ThemeToggle />
        </div>
      </Card>

      <Card className="mt-5 gap-4 rounded-2xl p-6">
        <h2 className="font-heading text-base font-semibold">Notifications</h2>
        {(
          [
            ["messages", "New messages", "When a seller or buyer replies to you"],
            ["priceDrops", "Price drops", "When a favorite or saved search gets cheaper"],
            ["escrow", "Escrow updates", "Every step of your purchases"],
            ["marketing", "Tips & news", "Occasional product updates"],
          ] as const
        ).map(([key, label, hint]) => (
          <div key={key} className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground">{hint}</p>
            </div>
            <Switch
              checked={alerts[key]}
              onCheckedChange={(v) => {
                setAlerts((a) => ({ ...a, [key]: v }));
                toast(`${label} ${v ? "enabled" : "disabled"}`);
              }}
              aria-label={label}
            />
          </div>
        ))}
      </Card>

      <Card className="mt-5 gap-4 rounded-2xl p-6">
        <h2 className="font-heading text-base font-semibold">Account</h2>
        <Separator />
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => {
              signOut();
              router.push("/");
            }}
          >
            <LogOut data-icon="inline-start" /> Sign out
          </Button>
        </div>
      </Card>
    </main>
  );
}
