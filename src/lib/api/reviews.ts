import type { Review, User } from "@/types";
import { delay, getDb, mutateDb, uid } from "@/lib/mock/db";
import { LIVE, http, many, one } from "./http";
import { normalizeReview } from "./normalize";

export async function getReviews(targetId: string): Promise<Review[]> {
  if (LIVE) return many<Review>(await http.get("/v1/reviews", { targetId })).map(normalizeReview);
  await delay(200);
  return getDb()
    .reviews.filter((r) => r.targetId === targetId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addReview(
  author: User,
  targetId: string,
  targetType: Review["targetType"],
  rating: number,
  body: string,
): Promise<Review> {
  if (LIVE) {
    return normalizeReview(one<Review>(await http.post("/v1/reviews", { targetId, targetType, rating, body }), "review") as Review);
  }
  await delay(500);
  const review: Review = {
    id: uid("rev"),
    targetId,
    targetType,
    authorId: author.id,
    authorName: author.name,
    authorAvatarUrl: author.avatarUrl,
    rating,
    body,
    createdAt: new Date().toISOString(),
  };
  mutateDb((db) => {
    db.reviews.unshift(review);
    // keep aggregate ratings roughly in sync
    if (targetType === "provider") {
      const p = db.providers.find((x) => x.id === targetId);
      if (p) {
        p.rating = +((p.rating * p.reviewsCount + rating) / (p.reviewsCount + 1)).toFixed(1);
        p.reviewsCount += 1;
      }
    } else if (targetType === "agent") {
      const u = db.users.find((x) => x.id === targetId);
      if (u && u.rating != null) {
        const count = u.reviewsCount ?? 0;
        u.rating = +((u.rating * count + rating) / (count + 1)).toFixed(1);
        u.reviewsCount = count + 1;
      }
    }
  });
  return review;
}

export function averageRating(reviews: Review[]): number {
  if (!reviews.length) return 0;
  return +(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
}
