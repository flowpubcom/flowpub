import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FLOWS } from "@/data/mock";
import { commentsFor } from "@/data/comments";
import { FlowReader } from "@/components/flow/FlowReader";

export function generateStaticParams() {
  return FLOWS.map((f) => ({ id: f.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const flow = FLOWS.find((f) => f.id === id);
  return { title: flow ? flow.title : "Flow" };
}

export default async function FlowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const flow = FLOWS.find((f) => f.id === id);
  if (!flow) notFound();
  return <FlowReader flow={flow} initialComments={commentsFor(id)} />;
}
