// Reactions are kept in the browser, beside the chat session they belong to.
// This app has no database of its own. RAGFlow can only store a yes/no flag on
// assistant replies, so it cannot remember "no reaction" or a vote on every message.

import { useSyncExternalStore } from "react";
import type { Message } from "@/lib/ragflow";

export type Reaction = "up" | "down";

type StoredReaction = {
  sessionId: string;
  role: Message["role"];
  content: string;
  nth: number;
  reaction: Reaction;
};

const STORAGE_KEY = "chatrag-reactions";
const NEW_SESSION = "new";
const EMPTY: StoredReaction[] = [];

let snapshot: StoredReaction[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

export function sessionKey(sessionId: string | undefined) {
  return sessionId ?? NEW_SESSION;
}

function readStored(): StoredReaction[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed.filter(isStoredReaction);
  } catch {
    return EMPTY;
  }
}

function commit(entries: StoredReaction[]) {
  snapshot = entries;
  loaded = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // The buttons still update for this visit if the browser refuses to store them.
  }
  for (const listener of listeners) listener();
}

function isStoredReaction(value: unknown): value is StoredReaction {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<StoredReaction>;
  return (
    typeof entry.sessionId === "string" &&
    (entry.role === "user" || entry.role === "assistant") &&
    typeof entry.content === "string" &&
    typeof entry.nth === "number" &&
    (entry.reaction === "up" || entry.reaction === "down")
  );
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    snapshot = readStored();
    loaded = true;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getClientSnapshot() {
  if (!loaded) {
    snapshot = readStored();
    loaded = true;
  }
  return snapshot;
}

export function useStoredReactions() {
  return useSyncExternalStore(subscribe, getClientSnapshot, () => EMPTY);
}

export function occurrenceIndex(messages: Message[], index: number) {
  const message = messages[index];
  let nth = 0;
  for (let i = 0; i < index; i++) {
    if (messages[i].role === message.role && messages[i].content === message.content) nth += 1;
  }
  return nth;
}

export function applyReactions(sessionId: string | undefined, messages: Message[], stored: StoredReaction[]) {
  const sid = sessionKey(sessionId);
  const mine = stored.filter((entry) => entry.sessionId === sid);
  if (mine.length === 0) return messages;

  return messages.map((message, index) => {
    const nth = occurrenceIndex(messages, index);
    const match = mine.find(
      (entry) => entry.role === message.role && entry.content === message.content && entry.nth === nth,
    );
    return match ? { ...message, reaction: match.reaction } : message;
  });
}

export function saveReaction(
  sessionId: string | undefined,
  messages: Message[],
  index: number,
  reaction: Reaction | undefined,
) {
  const message = messages[index];
  const sid = sessionKey(sessionId);
  const nth = occurrenceIndex(messages, index);
  const entries = getClientSnapshot().filter(
    (entry) =>
      !(
        entry.sessionId === sid &&
        entry.role === message.role &&
        entry.content === message.content &&
        entry.nth === nth
      ),
  );
  if (reaction) {
    entries.push({
      sessionId: sid,
      role: message.role,
      content: message.content,
      nth,
      reaction,
    });
  }
  commit(entries);
}

export function reassignNewChatReactions(sessionId: string) {
  const entries = getClientSnapshot();
  let changed = false;
  const next = entries.map((entry) => {
    if (entry.sessionId !== NEW_SESSION) return entry;
    changed = true;
    return { ...entry, sessionId };
  });
  if (changed) commit(next);
}

export function clearNewChatReactions() {
  const entries = getClientSnapshot();
  if (!entries.some((entry) => entry.sessionId === NEW_SESSION)) return;
  commit(entries.filter((entry) => entry.sessionId !== NEW_SESSION));
}
