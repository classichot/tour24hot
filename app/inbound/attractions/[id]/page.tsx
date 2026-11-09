import { notFound } from "next/navigation";
import ActivityDetail from "@/components/inbound/ActivityDetail";
import { activitiesOf, activityById } from "@/lib/activities";

export const dynamicParams = false;

export function generateStaticParams() {
  return activitiesOf("attraction").map((a) => ({ id: a.id }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = activityById(id);
  if (!a || a.kind !== "attraction") notFound();
  return <ActivityDetail a={a} />;
}
