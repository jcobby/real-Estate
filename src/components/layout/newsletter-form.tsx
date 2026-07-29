"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NewsletterForm() {
  const [email, setEmail] = useState("");

  return (
    <form
      className="mt-4 flex w-full max-w-sm gap-2 sm:mt-0"
      onSubmit={(e) => {
        e.preventDefault();
        if (!/^\S+@\S+\.\S+$/.test(email)) {
          toast.error("Please enter a valid email address");
          return;
        }
        toast.success("Subscribed! You'll hear from us when new plots go live.");
        setEmail("");
      }}
    >
      <div className="flex-1">
        <Label htmlFor="newsletter-email" className="sr-only">
          Email address
        </Label>
        <Input
          id="newsletter-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <Button type="submit">Subscribe</Button>
    </form>
  );
}
