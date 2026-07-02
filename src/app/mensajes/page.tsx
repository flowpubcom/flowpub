import type { Metadata } from "next";
import { AppShell } from "@/components/shell/AppShell";
import { MessagesShell } from "@/components/messages/MessagesShell";
import { fetchConversations } from "@/data/messagesApi";

export const metadata: Metadata = { title: "Mensajes" };

// Bandeja. El middleware ya gatea /mensajes (sin sesión → /entrar?next=).
export default async function MensajesPage() {
  const conversations = await fetchConversations();
  return (
    <AppShell active="messages" flush>
      <MessagesShell conversations={conversations} />
    </AppShell>
  );
}
