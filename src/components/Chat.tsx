"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Message } from "@/lib/ragflow";

export function Chat({ sessionId, history }: { sessionId?: string; history: Message[] }) {
  const router = useRouter();
  const [messages, setMessages] = useState(history);
  const [question, setQuestion] = useState("");
  const [waiting, setWaiting] = useState(false);

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
    if (!sessionId) router.push(`/?session=${data.sessionId}`);
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        {messages.map((message, i) => (
          <div
            key={i}
            className={`max-w-2xl whitespace-pre-wrap rounded-lg p-3 ${
              message.role === "user" ? "ml-auto bg-blue-100" : "bg-gray-100"
            }`}
          >
            {message.content}
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
