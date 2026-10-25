import Link from "next/link";
import { Chat } from "@/components/Chat";
import { getSession, listSessions } from "@/lib/ragflow";

export default async function Home({ searchParams }: PageProps<"/">) {
  const { session } = await searchParams;
  const sessionId = typeof session === "string" ? session : undefined;

  const sessions = await listSessions();
  const current = sessionId ? await getSession(sessionId) : undefined;

  return (
    <div className="flex h-screen">
      <nav className="w-64 space-y-1 overflow-y-auto border-r p-4">
        <Link href="/" className="mb-4 block rounded bg-blue-600 px-3 py-2 text-white">
          + New chat
        </Link>
        {sessions.map((s) => (
          <Link
            key={s.id}
            href={`/?session=${s.id}`}
            className={`block truncate rounded px-3 py-2 hover:bg-gray-100 ${
              s.id === sessionId ? "bg-gray-200" : ""
            }`}
          >
            {s.name}
          </Link>
        ))}
      </nav>
      <Chat key={sessionId ?? "new"} sessionId={sessionId} history={current?.messages ?? []} />
    </div>
  );
}
