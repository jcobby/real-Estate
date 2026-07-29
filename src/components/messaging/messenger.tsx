"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MessageSquareText, SendHorizonal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getConversations,
  getMessages,
  markConversationRead,
  mockReply,
  sendMessage,
} from "@/lib/api";
import { useSession } from "@/stores/session";
import { initials, timeAgo } from "@/lib/format";
import type { Conversation } from "@/types";
import { cn } from "@/lib/utils";

export function Messenger() {
  const { session } = useSession();
  const user = session!.user;
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [], isPending: convsPending } = useQuery({
    queryKey: ["conversations", user.id],
    queryFn: () => getConversations(user.id),
  });

  const active = conversations.find((c) => c.id === activeId) ?? null;

  const { data: messages = [], isPending: msgsPending } = useQuery({
    queryKey: ["messages", activeId],
    queryFn: () => getMessages(activeId!),
    enabled: !!activeId,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, typing]);

  const openConversation = async (conv: Conversation) => {
    setActiveId(conv.id);
    await markConversationRead(conv.id, user.id);
    queryClient.invalidateQueries({ queryKey: ["conversations", user.id] });
    queryClient.invalidateQueries({ queryKey: ["unread-messages", user.id] });
  };

  const send = useMutation({
    mutationFn: async () => {
      const body = draft.trim();
      setDraft("");
      await sendMessage(active!.id, user.id, body);
      queryClient.invalidateQueries({ queryKey: ["messages", active!.id] });
      queryClient.invalidateQueries({ queryKey: ["conversations", user.id] });
      // simulate the other side typing a reply
      const other = active!.participantIds.find((p) => p !== user.id);
      if (other) {
        setTyping(true);
        await mockReply(active!.id, other);
        setTyping(false);
        queryClient.invalidateQueries({ queryKey: ["messages", active!.id] });
        queryClient.invalidateQueries({ queryKey: ["conversations", user.id] });
      }
    },
  });

  const otherOf = (conv: Conversation) => conv.participants.find((p) => p.id !== user.id);

  return (
    <div className="grid h-[calc(100dvh-14rem)] min-h-120 overflow-hidden rounded-2xl border bg-card lg:grid-cols-[320px_1fr]">
      {/* conversation list */}
      <div className={cn("flex-col border-r", active ? "hidden lg:flex" : "flex")}>
        <div className="border-b px-5 py-4">
          <h1 className="font-heading text-lg font-bold">Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {convsPending ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="size-11 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-2/3" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <EmptyState
              icon={MessageSquareText}
              title="No conversations yet"
              description="Message a seller from any listing to start chatting."
              className="m-4"
            />
          ) : (
            <ul>
              {conversations.map((conv) => {
                const other = otherOf(conv);
                const unread = conv.unreadBy[user.id] ?? 0;
                return (
                  <li key={conv.id}>
                    <button
                      type="button"
                      onClick={() => openConversation(conv)}
                      aria-current={conv.id === activeId}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted",
                        conv.id === activeId && "bg-accent",
                      )}
                    >
                      <Avatar className="size-11">
                        <AvatarImage src={other?.avatarUrl} alt="" />
                        <AvatarFallback>{initials(other?.name ?? "?")}</AvatarFallback>
                      </Avatar>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className={cn("truncate text-sm", unread > 0 ? "font-bold" : "font-medium")}>
                            {other?.name}
                          </span>
                          <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(conv.lastMessageAt)}</span>
                        </span>
                        {conv.listingTitle && (
                          <span className="block truncate text-[11px] text-primary">{conv.listingTitle}</span>
                        )}
                        <span className={cn("block truncate text-xs", unread > 0 ? "font-semibold text-foreground" : "text-muted-foreground")}>
                          {conv.lastMessage}
                        </span>
                      </span>
                      {unread > 0 && <Badge className="h-5 min-w-5 rounded-full px-1.5">{unread}</Badge>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* thread */}
      <div className={cn("flex-col", active ? "flex" : "hidden lg:flex")}>
        {!active ? (
          <div className="flex flex-1 items-center justify-center p-8">
            <EmptyState
              icon={MessageSquareText}
              title="Pick a conversation"
              description="Choose a chat on the left to read and reply."
              className="border-none bg-transparent"
            />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b px-5 py-3.5">
              <Button variant="ghost" size="icon-sm" className="lg:hidden" aria-label="Back to conversations" onClick={() => setActiveId(null)}>
                <ArrowLeft />
              </Button>
              <Avatar className="size-9">
                <AvatarImage src={otherOf(active)?.avatarUrl} alt="" />
                <AvatarFallback>{initials(otherOf(active)?.name ?? "?")}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{otherOf(active)?.name}</p>
                {active.listingTitle && <p className="truncate text-xs text-muted-foreground">Re: {active.listingTitle}</p>}
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto bg-muted/20 p-5">
              {msgsPending ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className={cn("h-12 w-2/3 rounded-2xl", i % 2 && "ml-auto")} />
                  ))}
                </div>
              ) : (
                messages.map((m) => {
                  const mine = m.senderId === user.id;
                  return (
                    <div key={m.id} className={cn("flex", mine && "justify-end")}>
                      <div
                        className={cn(
                          "max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                          mine ? "rounded-br-md bg-secondary text-secondary-foreground" : "rounded-bl-md border bg-card",
                        )}
                      >
                        <p>{m.body}</p>
                        <p className={cn("mt-1 text-[10px]", mine ? "text-secondary-foreground/60" : "text-muted-foreground")}>
                          {timeAgo(m.sentAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              {typing && (
                <div className="flex" aria-label={`${otherOf(active)?.name} is typing`}>
                  <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border bg-card px-4 py-3 shadow-sm">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
                        style={{ animationDelay: `${i * 150}ms` }}
                        aria-hidden
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <form
              className="flex items-center gap-2 border-t p-3.5"
              onSubmit={(e) => {
                e.preventDefault();
                if (draft.trim() && !send.isPending) send.mutate();
              }}
            >
              <Label htmlFor="msg-input" className="sr-only">
                Type a message
              </Label>
              <Input
                id="msg-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message…"
                autoComplete="off"
                className="h-11"
              />
              <Button type="submit" size="icon-lg" className="size-11 shrink-0" aria-label="Send message" disabled={!draft.trim() || send.isPending}>
                <SendHorizonal />
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
