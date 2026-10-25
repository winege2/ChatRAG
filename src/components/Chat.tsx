"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Message } from "@/lib/ragflow";
import {
  applyReactions,
  clearNewChatReactions,
  reassignNewChatReactions,
  saveReaction,
  useStoredReactions,
  type Reaction,
} from "@/lib/reactions";

export function Chat({ sessionId, history }: { sessionId?: string; history: Message[] }) {
  const router = useRouter();
  const [messages, setMessages] = useState(history);
  const [question, setQuestion] = useState("");
  const [waiting, setWaiting] = useState(false);
  const storedReactions = useStoredReactions();
  // A brand-new chat has no session id until the first answer comes back.
  const [activeSessionId, setActiveSessionId] = useState(sessionId);
  const sessionForReactions = sessionId ?? activeSessionId;
  const visible = applyReactions(sessionForReactions, messages, storedReactions);

  // A blank chat should not inherit votes left behind by an unfinished one.
  useEffect(() => {
    if (!sessionId) clearNewChatReactions();
  }, [sessionId]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    setMessages([...messages, { role: "user", content: question }]);
    setQuestion("");
    setWaiting(true);

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, sessionId }),
    });
    const data = await response.json();

    setMessages((current) => [...current, { role: "assistant", content: data.answer }]);
    setWaiting(false);
    // A new chat got a session: move to its URL, so it shows up in the list.
    if (!sessionId && data.sessionId) {
      setActiveSessionId(data.sessionId);
      reassignNewChatReactions(data.sessionId);
      router.push(`/?session=${data.sessionId}`);
    }
  }

  function chooseReaction(index: number, choice: Reaction) {
    const current = visible[index];
    const reaction = current.reaction === choice ? undefined : choice;
    saveReaction(sessionForReactions, visible, index, reaction);
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        {visible.map((message, i) => (
          <div
            key={i}
            className={`flex max-w-2xl flex-col gap-1 ${message.role === "user" ? "ml-auto items-end" : "items-start"}`}
          >
            <div
              className={`whitespace-pre-wrap rounded-lg p-3 ${
                message.role === "user" ? "bg-blue-100" : "bg-gray-100"
              }`}
            >
              {message.content}
            </div>
            <div className="flex gap-1" role="group" aria-label="Reaction">
              <ReactionButton
                label="Thumbs up"
                pressed={message.reaction === "up"}
                onClick={() => chooseReaction(i, "up")}
              >
                <ThumbIcon />
              </ReactionButton>
              <ReactionButton
                label="Thumbs down"
                pressed={message.reaction === "down"}
                onClick={() => chooseReaction(i, "down")}
              >
                <ThumbIcon down />
              </ReactionButton>
            </div>
          </div>
        ))}
        {waiting && <p className="text-gray-500">Thinking...</p>}
      </div>

      <form onSubmit={send} className="flex gap-2 border-t p-4">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question..."
          aria-label="Question"
          className="flex-1 rounded border px-3 py-2"
        />
        <button disabled={!question || waiting} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">
          Send
        </button>
      </form>
    </div>
  );
}

function ReactionButton({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string;
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={pressed ? `${label}, selected. Click to clear.` : label}
      title={pressed ? `${label}. Click again to clear.` : label}
      onClick={onClick}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
        pressed
          ? "border-blue-600 bg-blue-600 text-white"
          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}

function ThumbIcon({ down = false }: { down?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      className={down ? "rotate-180" : undefined}
      fill="currentColor"
    >
      <path d="M7.5 11.2V20a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h2.5Zm2.1-.7 2.2-4.6A2 2 0 0 1 13.6 4.6c.5 0 .8.5.7.9L13.4 9H19a2 2 0 0 1 2 2.3l-1 6.2A2.5 2.5 0 0 1 17.5 20h-6.2a2 2 0 0 1-.9-.2l-1.8-.9a1 1 0 0 1-.5-.9v-6.2a1 1 0 0 1 .5-.9Z" />
    </svg>
  );
}
