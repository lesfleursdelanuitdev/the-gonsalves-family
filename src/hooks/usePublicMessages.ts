"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const BASE = "/api/messages";
const KEY = ["public", "messages"] as const;
export const PUBLIC_MESSAGES_UNREAD_KEY = ["public", "messages", "unread-count"] as const;

export type PublicMessageListItem = {
  id: string;
  subject: string | null;
  contentPreview: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  readAt: string | null;
  conversationId: string | null;
  sender: { id: string; username: string; displayName: string };
  recipient: { id: string; username: string; displayName: string } | null;
};

export type PublicMessageRecipient = {
  id: string;
  username: string;
  displayName: string;
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = typeof data?.error === "string" ? data.error : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

export function usePublicMessages(folder: "inbox" | "sent" = "inbox") {
  return useQuery({
    queryKey: [...KEY, folder],
    queryFn: () =>
      fetchJson<{ messages: PublicMessageListItem[]; total: number; hasMore: boolean }>(
        `${BASE}?folder=${folder}`,
      ),
  });
}

export function usePublicMessage(id: string | null) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => fetchJson<{ message: PublicMessageListItem }>(`${BASE}/${id}`).then((r) => r.message),
    enabled: Boolean(id),
  });
}

export function usePublicMessageRecipients(q?: string) {
  const params = new URLSearchParams();
  if (q?.trim()) params.set("q", q.trim());
  const qs = params.toString();
  return useQuery({
    queryKey: [...KEY, "recipients", q ?? ""],
    queryFn: () =>
      fetchJson<{ users: PublicMessageRecipient[] }>(`${BASE}/recipients${qs ? `?${qs}` : ""}`).then(
        (r) => r.users,
      ),
  });
}

export function usePublicUnreadMessageCount(enabled: boolean) {
  return useQuery({
    queryKey: PUBLIC_MESSAGES_UNREAD_KEY,
    queryFn: () => fetchJson<{ count: number }>(`${BASE}/unread-count`).then((r) => r.count),
    enabled,
    staleTime: 30_000,
    refetchInterval: 120_000,
  });
}

export function useSendPublicMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      recipientId: string;
      subject?: string;
      content: string;
      conversationId?: string | null;
    }) =>
      fetchJson(`${BASE}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
      void qc.invalidateQueries({ queryKey: PUBLIC_MESSAGES_UNREAD_KEY });
    },
  });
}

export function useMarkPublicMessageRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isRead }: { id: string; isRead: boolean }) =>
      fetchJson<{ message: PublicMessageListItem }>(`${BASE}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead }),
      }).then((r) => r.message),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
      void qc.invalidateQueries({ queryKey: PUBLIC_MESSAGES_UNREAD_KEY });
    },
  });
}
