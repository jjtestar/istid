import { InviteForm } from "@/app/admin/anvandare/InviteForm";
import { PasswordResetButton } from "@/app/admin/anvandare/PasswordResetButton";
import { revokeInvite, setSuperAdmin, setUserAccess, setUserRole } from "@/app/admin/anvandare/actions";
import { AdminHeader } from "@/components/AdminHeader";
import { Card, Eyebrow } from "@/components/ui";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const date=(value:Date)=>new Intl.DateTimeFormat("sv-SE",{dateStyle:"medium"}).format(value);

export default async function UserAdminPage(){
  const admin=await requireAdmin();
  const [teams,invitations,users,superCount]=await Promise.all([
    prisma.team.findMany({where:{archivedAt:null},orderBy:[{season:"desc"},{name:"asc"}],select:{id:true,name:true,season:true}}),
    prisma.inviteCode.findMany({orderBy:{createdAt:"desc"},take:30,include:{team:{select:{name:true,season:true}},usedBy:{select:{name:true}}}}),
    prisma.user.findMany({orderBy:[{isSuperAdmin:"desc"},{role:"desc"},{name:"asc"}],select:{id:true,name:true,email:true,role:true,isActive:true,isSuperAdmin:true,teams:{select:{team:{select:{name:true,archivedAt:true}}}}}}),
    prisma.user.count({where:{isSuperAdmin:true}}),
  ]);
  const now=new Date();
  return <div><AdminHeader title="Användare"/><main className="space-y-6 px-5 pb-10">
    <Card className="p-5"><Eyebrow>Ny spelare</Eyebrow><h2 className="mt-1 section-title">Skapa PIN-inbjudan</h2><p className="mt-2 text-sm text-ink-subtle">Koden knyts till e-post och lag, gäller i 14 dagar och kan användas en gång.</p><InviteForm teams={teams.map(t=>({id:t.id,label:`${t.name} · ${t.season}`}))}/></Card>
    <Card className="overflow-hidden"><div className="border-b border-divider p-5"><Eyebrow>Konton</Eyebrow><h2 className="mt-1 section-title">Användare och roller</h2>{admin.isSuperAdmin?<p className="mt-2 text-sm text-ink-subtle">{superCount} av 2 huvudadmins utsedda.</p>:null}</div>
      <div className="divide-y divide-divider">{users.map(user=><div key={user.id} className="p-4">
        <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-bold">{user.name??"Namnlös användare"}</p><p className="truncate text-sm text-ink-subtle">{user.email}</p><p className="mt-1 text-xs font-bold text-ink-subtle">{user.isSuperAdmin?"Huvudadmin":user.role==="ADMIN"?"Admin":[...new Set(user.teams.filter(x=>!x.team.archivedAt).map(x=>x.team.name))].join(", ")||"Spelare utan lag"}</p></div>{user.id===admin.id?<span className="rounded-full bg-rink-crease px-3 py-1 text-xs font-bold">Du</span>:<form action={setUserAccess}><input type="hidden" name="userId" value={user.id}/><input type="hidden" name="isActive" value={user.isActive?"false":"true"}/><button disabled={user.isSuperAdmin||(user.role==="ADMIN"&&!admin.isSuperAdmin)} className={`rounded-full border px-3 py-1 text-xs font-bold disabled:opacity-30 ${user.isActive?"border-signal text-signal":"border-ink bg-ink text-white"}`}>{user.isActive?"Spärra":"Aktivera"}</button></form>}</div>
        {user.isActive&&(user.id===admin.id||(!user.isSuperAdmin&&(admin.isSuperAdmin||user.role==="PLAYER")))?<div className="mt-3"><PasswordResetButton userId={user.id}/></div>:null}
        {user.id!==admin.id&&(admin.isSuperAdmin||user.role==="PLAYER")?<div className="mt-3 flex flex-wrap gap-2">
          {!user.isSuperAdmin&&(admin.isSuperAdmin||user.role==="PLAYER")?<form action={setUserRole}><input type="hidden" name="userId" value={user.id}/><input type="hidden" name="role" value={user.role==="ADMIN"?"PLAYER":"ADMIN"}/><button className="rounded-xl border border-divider px-3 py-2 text-xs font-bold">{user.role==="ADMIN"?"Gör till spelare":"Gör till admin"}</button></form>:null}
          {user.isSuperAdmin?<form action={setSuperAdmin}><input type="hidden" name="userId" value={user.id}/><input type="hidden" name="enabled" value="false"/><button className="rounded-xl border border-signal px-3 py-2 text-xs font-bold text-signal">Ta bort huvudadmin</button></form>:user.role==="ADMIN"&&superCount<2?<form action={setSuperAdmin}><input type="hidden" name="userId" value={user.id}/><input type="hidden" name="enabled" value="true"/><button className="rounded-xl bg-ink px-3 py-2 text-xs font-bold text-white">Gör till huvudadmin</button></form>:null}
        </div>:null}
        {!user.isActive?<p className="mt-2 text-xs font-bold text-signal">Spärrad – kan inte logga in</p>:null}
      </div>)}</div>
    </Card>
    <Card className="overflow-hidden"><div className="border-b border-divider p-5"><Eyebrow>Historik</Eyebrow><h2 className="mt-1 section-title">PIN-koder</h2></div><div className="divide-y divide-divider">{invitations.length?invitations.map(invite=>{const status=invite.usedAt?`Använd av ${invite.usedBy?.name??invite.email}`:invite.revokedAt?"Återkallad":invite.expiresAt<=now?"Utgången":"Aktiv";const active=status==="Aktiv";return <div key={invite.id} className="flex items-start justify-between gap-3 p-4"><div className="min-w-0"><p className="truncate font-bold">{invite.email}</p><p className="text-xs text-ink-subtle">{invite.team.name} · {invite.team.season}</p><p className="mt-1 text-xs font-bold text-ink-subtle">{status} · {active?`går ut ${date(invite.expiresAt)}`:date(invite.usedAt??invite.revokedAt??invite.expiresAt)}</p></div>{active?<form action={revokeInvite}><input type="hidden" name="inviteId" value={invite.id}/><button className="rounded-xl border border-divider px-3 py-2 text-xs font-bold text-signal">Återkalla</button></form>:null}</div>}):<p className="p-5 text-sm text-ink-subtle">Inga inbjudningar ännu.</p>}</div></Card>
  </main></div>;
}
