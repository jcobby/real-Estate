"use client";

import Image from "next/image";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquarePlus, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { StarRating } from "./star-rating";
import { EmptyState } from "./empty-state";
import { addReview, averageRating, getReviews } from "@/lib/api";
import { useSession } from "@/stores/session";
import { timeAgo } from "@/lib/format";
import type { Review } from "@/types";

export function ReviewsList({
  targetId,
  targetType,
}: {
  targetId: string;
  targetType: Review["targetType"];
}) {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const { data: reviews = [], isPending } = useQuery({
    queryKey: ["reviews", targetId],
    queryFn: () => getReviews(targetId),
  });

  const submit = useMutation({
    mutationFn: () => addReview(session!.user, targetId, targetType, rating, body.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", targetId] });
      setBody("");
      setFormOpen(false);
      toast.success("Review published — thank you!");
    },
  });

  return (
    <section aria-label="Reviews">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="font-heading text-base font-semibold">Reviews</h3>
          {reviews.length > 0 && <StarRating rating={averageRating(reviews)} count={reviews.length} />}
        </div>
        {session?.user.role === "buyer" && (
          <Button variant="outline" size="sm" onClick={() => setFormOpen((v) => !v)}>
            <MessageSquarePlus data-icon="inline-start" /> Write a review
          </Button>
        )}
      </div>

      {formOpen && session && (
        <form
          className="mt-4 space-y-3 rounded-xl border bg-muted/40 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (body.trim().length < 10) {
              toast.error("Please write at least 10 characters");
              return;
            }
            submit.mutate();
          }}
        >
          <div>
            <Label className="mb-1.5 block">Your rating</Label>
            <StarRating rating={rating} interactive onChange={setRating} size="lg" />
          </div>
          <div>
            <Label htmlFor={`review-body-${targetId}`}>Your experience</Label>
            <Textarea
              id={`review-body-${targetId}`}
              rows={3}
              className="mt-1.5"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="How was working with them?"
            />
          </div>
          <Button type="submit" size="sm" disabled={submit.isPending}>
            {submit.isPending ? "Publishing…" : "Publish review"}
          </Button>
        </form>
      )}

      <div className="mt-4">
        {isPending ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <EmptyState
            icon={Star}
            title="No reviews yet"
            description="Be the first to share your experience."
            className="py-8"
          />
        ) : (
          <ul className="space-y-1">
            {reviews.map((r, i) => (
              <li key={r.id}>
                {i > 0 && <Separator className="my-3" />}
                <article>
                  <div className="flex items-center gap-2.5">
                    <Image src={r.authorAvatarUrl} alt="" width={32} height={32} className="size-8 rounded-full object-cover" />
                    <div>
                      <p className="text-sm font-semibold">{r.authorName}</p>
                      <p className="text-xs text-muted-foreground">{timeAgo(r.createdAt)}</p>
                    </div>
                    <StarRating rating={r.rating} className="ml-auto [&_span]:hidden" />
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
