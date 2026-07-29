import type { Conversation, Message, User } from "@/types";
import { delay, getDb, mutateDb, uid } from "@/lib/mock/db";
import { LIVE, http, many, one, payload } from "./http";
import { fallbackAvatar } from "./normalize";
import { pushNotification } from "./notifications";

export async function getConversations(userId: string): Promise<Conversation[]> {
  if (LIVE) {
    return many<Conversation>(await http.get("/v1/conversations")).map((c) => ({
      ...c,
      participants: (c.participants ?? []).map((p) => ({ ...p, avatarUrl: p.avatarUrl || fallbackAvatar(p.id) })),
    }));
  }
  await delay();
  return getDb()
    .conversations.filter((c) => c.participantIds.includes(userId))
    .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  if (LIVE) return many<Message>(await http.get(`/v1/conversations/${conversationId}/messages`));
  await delay(200);
  return getDb()
    .messages.filter((m) => m.conversationId === conversationId)
    .sort((a, b) => a.sentAt.localeCompare(b.sentAt));
}

export async function sendMessage(conversationId: string, senderId: string, body: string): Promise<Message> {
  if (LIVE) return (one<Message>(await http.post(`/v1/conversations/${conversationId}/messages`, { body }), "message")) as Message;

  await delay(250);
  const msg: Message = {
    id: uid("msg"),
    conversationId,
    senderId,
    body,
    sentAt: new Date().toISOString(),
  };
  mutateDb((db) => {
    db.messages.push(msg);
    const conv = db.conversations.find((c) => c.id === conversationId);
    if (conv) {
      conv.lastMessage = body;
      conv.lastMessageAt = msg.sentAt;
      for (const pid of conv.participantIds) {
        if (pid !== senderId) conv.unreadBy[pid] = (conv.unreadBy[pid] ?? 0) + 1;
      }
    }
  });
  return msg;
}

export async function markConversationRead(conversationId: string, userId: string): Promise<void> {
  if (LIVE) {
    await http.post(`/v1/conversations/${conversationId}/read`).catch(() => {});
    return;
  }
  mutateDb((db) => {
    const conv = db.conversations.find((c) => c.id === conversationId);
    if (conv) conv.unreadBy[userId] = 0;
  });
}

/** Find or create a conversation between two users (optionally about a listing). */
export async function startConversation(
  me: User,
  otherUserId: string,
  opts: { listingId?: string; listingTitle?: string; firstMessage?: string } = {},
): Promise<Conversation> {
  if (LIVE) {
    return (one<Conversation>(
      await http.post("/v1/conversations", {
        sellerId: otherUserId,
        listingId: opts.listingId,
        body: opts.firstMessage ?? "",
      }),
      "conversation",
    )) as Conversation;
  }

  await delay(300);
  const db = getDb();
  let conv = db.conversations.find(
    (c) =>
      c.participantIds.includes(me.id) &&
      c.participantIds.includes(otherUserId) &&
      (!opts.listingId || c.listingId === opts.listingId),
  );
  if (!conv) {
    const other = db.users.find((u) => u.id === otherUserId);
    const newConv: Conversation = {
      id: uid("conv"),
      participantIds: [me.id, otherUserId],
      participants: [me, other]
        .filter((u): u is User => !!u)
        .map((u) => ({ id: u.id, name: u.name, avatarUrl: u.avatarUrl, role: u.role })),
      listingId: opts.listingId,
      listingTitle: opts.listingTitle,
      lastMessage: opts.firstMessage ?? "",
      lastMessageAt: new Date().toISOString(),
      unreadBy: {},
    };
    mutateDb((d) => d.conversations.unshift(newConv));
    conv = newConv;
  }
  if (opts.firstMessage) await sendMessage(conv.id, me.id, opts.firstMessage);
  return conv;
}

const CANNED_REPLIES = [
  "Thanks for reaching out! Let me check and get right back to you.",
  "Good question — yes, that's possible. When would you like to visit the site?",
  "I've just sent the documents to your dashboard. Anything else you'd like to see?",
  "We can be flexible on that. Shall I pencil you in for a call tomorrow?",
];

/**
 * Demo realism (mock only): the other party "types" and replies. With a real
 * backend the counterpart replies for real, so this is a no-op — messages are
 * refreshed by polling. The returned value is unused by callers.
 */
export async function mockReply(conversationId: string, replierId: string): Promise<Message> {
  if (LIVE) {
    return { id: "", conversationId, senderId: replierId, body: "", sentAt: new Date().toISOString() };
  }
  await delay(2200 + Math.random() * 1600);
  const body = CANNED_REPLIES[Math.floor(Math.random() * CANNED_REPLIES.length)];
  const msg = await sendMessage(conversationId, replierId, body);
  const conv = getDb().conversations.find((c) => c.id === conversationId);
  const other = conv?.participantIds.find((p) => p !== replierId);
  const replier = getDb().users.find((u) => u.id === replierId);
  if (other && replier) {
    pushNotification({
      userId: other,
      type: "message",
      title: `New message from ${replier.name}`,
      body,
      href: "/dashboard/messages",
    });
  }
  return msg;
}

export async function getUnreadCount(userId: string): Promise<number> {
  if (LIVE) {
    const d = payload<{ count?: number; unread?: number }>(await http.get("/v1/me/unread-count"));
    return d.count ?? d.unread ?? 0;
  }
  const convs = getDb().conversations.filter((c) => c.participantIds.includes(userId));
  return convs.reduce((sum, c) => sum + (c.unreadBy[userId] ?? 0), 0);
}
