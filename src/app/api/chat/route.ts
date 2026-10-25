// POST /api/chat: the browser sends a question here, and we forward it to RAGFlow.
// The browser never talks to RAGFlow directly, so it never sees the API key.

import { ask, createSession } from "@/lib/ragflow";

export async function POST(request: Request) {
  const { question, sessionId } = await request.json();

  // A new chat: create a session in RAGFlow, named after the first question.
  const id = sessionId ?? (await createSession(question.slice(0, 60))).id;
  const reply = await ask(id, question);

  return Response.json({ sessionId: id, answer: reply.answer });
}
