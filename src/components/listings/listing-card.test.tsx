import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ListingCard } from "./listing-card";
import { buildSeedDb } from "@/lib/mock/seed";

describe("<ListingCard />", () => {
  const listing = buildSeedDb().listings.find((l) => l.id === "lst-001")!;

  it("renders title, price and location", () => {
    render(<ListingCard listing={listing} />);
    expect(screen.getByRole("link", { name: listing.title })).toHaveAttribute("href", "/property/lst-001");
    expect(screen.getByText("₵85,000")).toBeInTheDocument();
    expect(screen.getByText(/Oyibi · Greater Accra/)).toBeInTheDocument();
  });

  it("shows the verification badge and map chip for estate listings", () => {
    render(<ListingCard listing={listing} />);
    expect(screen.getByText("Verified")).toBeInTheDocument();
    expect(screen.getByText(/Pick plots on map/i)).toBeInTheDocument();
  });

  it("has an accessible favorite toggle", () => {
    render(<ListingCard listing={listing} />);
    expect(screen.getByRole("button", { name: /save to favorites/i })).toHaveAttribute("aria-pressed", "false");
  });
});
