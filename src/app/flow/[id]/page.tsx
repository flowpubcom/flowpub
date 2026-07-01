import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchFlow } from "@/data/flowsApi";
import { fetchComments } from "@/data/commentsApi";
import { FlowReader } from "@/components/flow/FlowReader";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const flow = await fetchFlow(id);
  return { title: flow ? flow.title : "Flow" };
}

export default async function FlowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const flow = await fetchFlow(id);
  if (!flow) notFound();
  const comments = await fetchComments(id);
  return <FlowReader flow={flow} initialComments={comments} />;
}
