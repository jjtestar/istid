import { PageHeader } from "@/components/PageHeader";

export function AdminHeader({ title }: { title: string }) {
  return <PageHeader title={title} back={{ href: "/admin", label: "Tillbaka till adminöversikt" }} />;
}
