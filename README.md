# ChatRAG

The thinnest possible chat UI on top of a [RAGFlow](https://github.com/infiniflow/ragflow) chat assistant.
Built with Next.js, React, TypeScript and Tailwind CSS.

The app has no database of its own: the chat sessions and their messages are stored in RAGFlow.

## Run it

You need [Node.js](https://nodejs.org/) (LTS) and access to a RAGFlow server with a chat assistant.

```bash
npm install
cp .env.example .env.local     # Windows: copy .env.example .env.local
```

Fill in `.env.local`:

| Variable | Meaning |
| --- | --- |
| `RAGFLOW_URL` | The address of the RAGFlow server, e.g. `http://localhost` |
| `RAGFLOW_API_KEY` | A RAGFlow API key |
| `RAGFLOW_CHAT_ID` | The ID of the chat assistant to talk to |

```bash
npm run dev
```

Open <http://localhost:3000>.

## How it works

```text
Browser  ──POST /api/chat──►  Next.js server  ──RAGFlow API + API key──►  RAGFlow
```

| File | What it does |
| --- | --- |
| `src/app/page.tsx` | The page (server component): the list of sessions, and the open chat |
| `src/components/Chat.tsx` | The chat (client component): messages, the input box, sending a question |
| `src/app/api/chat/route.ts` | `POST /api/chat`: the browser sends questions here, and it forwards them to RAGFlow |
| `src/lib/ragflow.ts` | The calls to the RAGFlow API (server only, it holds the API key) |
| `src/app/loading.tsx` | Shown while the page loads its data from RAGFlow |

RAGFlow endpoints used (see the [HTTP API reference](https://ragflow.io/docs/dev/http_api_reference)):

- `GET /api/v1/chats/{chat_id}/sessions`: list the sessions
- `GET /api/v1/chats/{chat_id}/sessions/{session_id}`: one session, with its messages
- `POST /api/v1/chats/{chat_id}/sessions`: create a session
- `POST /api/v1/chat/completions`: ask a question in a session

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server, updates on every save |
| `npm run build` | Type check and production build |
| `npm run start` | Run the production build |
| `npm run lint` | Check the code with ESLint |
