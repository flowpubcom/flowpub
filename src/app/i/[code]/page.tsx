import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InviteLanding } from "@/components/invites/InviteLanding";
import { fetchInviteInfo } from "@/data/invitesApi";

// Landing pública de una invitación. Código inválido → 404 sin pistas.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const info = await fetchInviteInfo(code);
  if (!info) return { title: "Invitación" };
  return {
    title: `${info.displayName} te invita a FlowPub`,
    description:
      "Habla hasta 3 minutos y FlowPub vuelve tu voz un artículo con portada — y una comunidad que escucha.",
    robots: { index: false, follow: false },
  };
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  if (!/^[a-f0-9]{8}$/i.test(code)) notFound();
  const info = await fetchInviteInfo(code);
  if (!info) notFound();

  return <InviteLanding code={code} info={info} />;
}
