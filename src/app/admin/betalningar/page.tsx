import { createPayment, setPaymentStatus } from "@/app/admin/actions";
import { AdminHeader } from "@/components/AdminHeader";
import { Card, Eyebrow } from "@/components/ui";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const field="h-11 w-full rounded-xl border border-divider bg-white px-3 text-base outline-none focus:border-ink";
const money=(ore:number)=>new Intl.NumberFormat("sv-SE",{style:"currency",currency:"SEK",maximumFractionDigits:2}).format(ore/100);
const date=(value:Date)=>new Intl.DateTimeFormat("sv-SE",{dateStyle:"medium"}).format(value);

export default async function AdminPaymentsPage(){
  await requireAdmin();
  const [members,payments]=await Promise.all([
    prisma.teamMember.findMany({orderBy:{user:{name:"asc"}},include:{user:true,team:true}}),
    prisma.payment.findMany({orderBy:[{paidAt:"asc"},{dueDate:"desc"}],take:100,include:{user:true,team:true}}),
  ]);
  return <div><AdminHeader title="Betalningar"/><main className="space-y-6 px-5 pb-10">
    <Card className="p-5"><Eyebrow>Ny avgift</Eyebrow><h2 className="mt-1 section-title">Registrera betalning</h2>
      <form action={createPayment} className="mt-4 grid gap-3 lg:grid-cols-2">
        <select name="membershipId" required className={`${field} lg:col-span-2`}>{members.map(m=><option key={m.id} value={m.id}>{m.user.name} · {m.team.name} · {m.team.season}</option>)}</select>
        <input name="title" required placeholder="Exempel: Säsongsavgift" className={field}/><input name="amount" required type="number" min="0" step="0.01" placeholder="Belopp i kronor" className={field}/>
        <input name="dueDate" required type="date" className={field}/><input name="note" placeholder="Kommentar (valfritt)" className={field}/>
        <button className="h-11 rounded-xl bg-ink font-bold text-white lg:col-span-2">Skapa betalning</button>
      </form>

    </Card>
    <Card className="overflow-hidden"><div className="border-b border-divider p-5"><h2 className="section-title">Alla betalningar</h2><p className="mt-1 text-sm text-ink-subtle">{payments.filter(p=>!p.paidAt).length} obetalda</p></div>
      <div className="divide-y divide-divider">{payments.length?payments.map(p=><div key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div><p className="font-bold">{p.title} · {money(p.amountOre)}</p><p className="text-sm text-ink-subtle">{p.user.name} · {p.team.name} · förfaller {date(p.dueDate)}</p>{p.note?<p className="mt-1 text-xs text-ink-subtle">{p.note}</p>:null}</div>
        <form action={setPaymentStatus}><input type="hidden" name="paymentId" value={p.id}/><input type="hidden" name="paid" value={p.paidAt?"false":"true"}/><button className={`rounded-full px-3 py-2 text-xs font-bold ${p.paidAt?"bg-rink-crease text-success":"bg-rink-line-red text-signal"}`}>{p.paidAt?"Betald – ångra":"Markera betald"}</button></form>
      </div>):<p className="p-5 text-sm text-ink-subtle">Inga betalningar registrerade.</p>}</div>
    </Card>
  </main></div>;
}
