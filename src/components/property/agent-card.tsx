"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Mail, MessageSquareText, Phone, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { StarRating } from "@/components/shared/star-rating";
import { ReviewsList } from "@/components/shared/reviews-list";
import { getUser, startConversation } from "@/lib/api";
import { useSession } from "@/stores/session";
import { initials } from "@/lib/format";
import type { Listing } from "@/types";

export function AgentCard({ listing }: { listing: Listing }) {
  const router = useRouter();
  const { session } = useSession();
  const [messageOpen, setMessageOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [body, setBody] = useState(`Hi, I'm interested in "${listing.title}". Is it still available?`);
  const [sending, setSending] = useState(false);

  const { data: agent } = useQuery({
    queryKey: ["user", listing.sellerId],
    queryFn: () => getUser(listing.sellerId),
  });

  if (!agent) {
    return <Card className="h-40 animate-pulse rounded-2xl" />;
  }

  const requireAuth = (fn: () => void) => {
    if (!session) {
      toast("Sign in to contact the seller", { description: "Create a free buyer account in under a minute." });
      router.push("/login");
      return;
    }
    fn();
  };

  const send = async () => {
    if (!session || !body.trim()) return;
    setSending(true);
    try {
      await startConversation(session.user, agent.id, {
        listingId: listing.id,
        listingTitle: listing.title,
        firstMessage: body.trim(),
      });
      setMessageOpen(false);
      toast.success("Message sent", { description: `${agent.name} usually replies within a few hours.` });
      router.push("/dashboard/messages");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="gap-4 rounded-2xl p-5">
      <div className="flex items-center gap-3">
        <Avatar className="size-14">
          <AvatarImage src={agent.avatarUrl} alt="" />
          <AvatarFallback>{initials(agent.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 font-semibold">
            <span className="truncate">{agent.name}</span>
            {agent.verified && <BadgeCheck className="size-4 shrink-0 text-success" aria-label="Verified seller" />}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {agent.company ?? "Independent owner"} · {listing.sellerType}
          </p>
          {agent.rating != null && <StarRating rating={agent.rating} count={agent.reviewsCount} className="mt-1" />}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" render={<a href={`tel:${agent.phone.replace(/\s/g, "")}`} />}>
          <Phone data-icon="inline-start" /> Call
        </Button>
        <Button variant="outline" render={<a href={`mailto:${agent.email}`} />}>
          <Mail data-icon="inline-start" /> Email
        </Button>
        <Button className="col-span-2" onClick={() => requireAuth(() => setMessageOpen(true))}>
          <MessageSquareText data-icon="inline-start" /> Message {agent.name.split(" ")[0]}
        </Button>
        <Button variant="ghost" className="col-span-2" onClick={() => setProfileOpen(true)}>
          <UserRound data-icon="inline-start" /> View profile &amp; reviews
        </Button>
      </div>

      <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Message {agent.name}</DialogTitle>
            <DialogDescription>About: {listing.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="agent-msg">Your message</Label>
            <Textarea id="agent-msg" rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageOpen(false)}>
              Cancel
            </Button>
            <Button onClick={send} disabled={sending || !body.trim()}>
              {sending ? "Sending…" : "Send message"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {agent.name}
              {agent.verified && <BadgeCheck className="size-4 text-success" aria-label="Verified" />}
            </DialogTitle>
            <DialogDescription>
              {agent.company ?? "Independent owner"} · {agent.region} · Member since{" "}
              {new Date(agent.joinedAt).getFullYear()}
            </DialogDescription>
          </DialogHeader>
          {agent.bio && <p className="text-sm leading-relaxed text-muted-foreground">{agent.bio}</p>}
          <ReviewsList targetId={agent.id} targetType="agent" />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
