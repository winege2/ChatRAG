// Talks to the RAGFlow API. Runs only on the server: it uses the API key.

export type Message = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  // Set in the browser. RAGFlow does not store this.
  reaction?: "up" | "down";
};

export type Session = {
  id: string;
  name: string;
  messages: Message[];
};

const CHAT_ID = process.env.RAGFLOW_CHAT_ID;

async function ragflow<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${process.env.RAGFLOW_URL}/api/v1${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RAGFLOW_API_KEY}`,
    },
  });
  const body = await response.json();
  // RAGFlow returns code 0 on success, and an error code + message otherwise.
  if (body.code !== 0) {
    throw new Error(`RAGFlow error ${body.code}: ${body.message}`);
  }
  return body.data;
}

export function listSessions() {
  return ragflow<Session[]>(`/chats/${CHAT_ID}/sessions?include_history=false`);
}

export function getSession(sessionId: string) {
  return ragflow<Session>(`/chats/${CHAT_ID}/sessions/${sessionId}`);
}

export function createSession(name: string) {
  return ragflow<Session>(`/chats/${CHAT_ID}/sessions`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function ask(sessionId: string, question: string) {
  return ragflow<{ id: string; answer: string }>("/chat/completions", {
    method: "POST",
    body: JSON.stringify({
      chat_id: CHAT_ID,
      session_id: sessionId,
      question,
      stream: false,
    }),
  });
}
