import { createHighlight, deleteHighlight } from "@/app/admin/actions";
import { AdminHeader } from "@/components/AdminHeader";
import { Card, Eyebrow } from "@/components/ui";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const field="h-11 w-full rounded-xl border border-divider bg-white px-3 text-base outline-none focus:border-ink";
const date=(value:Date)=>new Intl.DateTimeFormat("sv-SE",{dateStyle:"medium"}).format(value);

export default async function AdminHighlightsPage(){
  await requireAdmin();
  const [teams,highlights]=await Promise.all([
    prisma.team.findMany({orderBy:[{season:"desc"},{name:"asc"}]}),
    prisma.highlight.findMany({orderBy:{createdAt:"desc"},take:100,include:{team:true,author:{select:{name:true}}}}),
  ]);
  return <div><AdminHeader title="Highlights"/><main className="space-y-6 px-5 pb-10">
    <Card className="p-5"><Eyebrow>Nytt klipp</Eyebrow><h2 className="mt-1 section-title">Lägg till highlight</h2><form action={createHighlight} className="mt-4 grid gap-3 lg:grid-cols-2">
      <select name="teamId" required className={field}>{teams.map(t=><option key={t.id} value={t.id}>{t.name} · {t.season}</option>)}</select>
      <input name="title" required maxLength={120} placeholder="Rubrik, exempelvis Mål 2–1" className={field}/>
      <input name="url" required type="url" placeholder="Länk till klippet" className={`${field} lg:col-span-2`}/>
      <button className="h-11 rounded-xl bg-ink font-bold text-white lg:col-span-2">Lägg till highlight</button>
    </form></Card>
    <Card className="overflow-hidden"><div className="border-b border-divider p-5"><h2 className="section-title">Publicerade highlights</h2></div><div className="divide-y divide-divider">{highlights.length?highlights.map(h=><div key={h.id} className="flex items-center justify-between gap-3 p-4">
      <div className="min-w-0"><a href={h.url} target="_blank" rel="noreferrer" className="block truncate font-bold underline underline-offset-4">{h.title}</a><p className="text-sm text-ink-subtle">{h.team.name} · {date(h.createdAt)} · {h.author.name}</p></div>
      <form action={deleteHighlight}><input type="hidden" name="highlightId" value={h.id}/><button className="rounded-xl border border-divider px-3 py-2 text-xs font-bold text-signal">Ta bort</button></form>
    </div>):<p className="p-5 text-sm text-ink-subtle">Inga highlights ännu.</p>}</div></Card>
  </main></div>;
}
