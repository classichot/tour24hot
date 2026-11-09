import { notFound } from "next/navigation";
import ActivityDetail from "@/components/inbound/ActivityDetail";
import { activitiesOf, activityById } from "@/lib/activities";

export const dynamicParams = false;

export function generateStaticParams() {
  return activitiesOf("daytour").map((a) => ({ id: a.id }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = activityById(id);
  if (!a || a.kind !== "daytour") notFound();
  return <ActivityDetail a={a} />;
}
