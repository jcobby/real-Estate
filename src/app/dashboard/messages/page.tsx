import type { Metadata } from "next";
import { Messenger } from "@/components/messaging/messenger";

export const metadata: Metadata = { title: "Messages" };

export default function BuyerMessagesPage() {
  return <Messenger />;
}
