import type { Metadata } from "next";
import { Messenger } from "@/components/messaging/messenger";

export const metadata: Metadata = { title: "Seller messages" };

export default function SellerMessagesPage() {
  return <Messenger />;
}
