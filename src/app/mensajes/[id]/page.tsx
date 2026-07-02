import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { MessagesShell } from "@/components/messages/MessagesShell";
import {
  fetchConversationMeta,
  fetchConversations,
  fetchMessages,
} from "@/data/messagesApi";

export const metadata: Metadata = { title: "Mensajes" };

// Conversación abierta. La RLS decide: si no soy integrante, meta = null → a la
// bandeja. El middleware ya exige sesión.
export default async function ConversacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [conversations, meta, messages] = await Promise.all([
    fetchConversations(),
    fetchConversationMeta(id),
    fetchMessages(id),
  ]);

  if (!meta) redirect("/mensajes");

  return (
    <AppShell active="messages" flush>
      <MessagesShell
        conversations={conversations}
        activeId={id}
        active={{ other: meta.other, messages }}
      />
    </AppShell>
  );
}
