import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";

export function AdminHeader({ title }: { title: string }) {
  return <PageHeader title={title} right={<Link href="/admin" className="rounded-xl border border-divider bg-white px-3 py-2 text-sm font-bold text-ink">Adminöversikt</Link>} />;
}
