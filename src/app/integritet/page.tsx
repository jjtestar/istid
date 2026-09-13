import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Card, Eyebrow } from "@/components/ui";

const company = {
  name: "Istid Test AB (fiktivt)",
  organisationNumber: "000000-0000",
  email: "gdpr@istid.example",
  address: "Testgatan 1, 123 45 Teststad",
};

function emailHref(subject: string, body: string) {
  return `mailto:${company.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

const contactActions = [
  {
    label: "Begär registerutdrag",
    subject: "Begäran om registerutdrag i Istid",
    body: "Hej,\n\nJag vill begära tillgång till de personuppgifter som behandlas om mig i Istid.\n\nE-post för mitt konto:\n",
  },
  {
    label: "Begär rättelse",
    subject: "Begäran om rättelse i Istid",
    body: "Hej,\n\nJag vill rätta följande personuppgifter i Istid:\n\n",
  },
  {
    label: "Begär radering",
    subject: "Begäran om radering i Istid",
    body: "Hej,\n\nJag vill begära att mina personuppgifter och mitt konto i Istid raderas.\n\nE-post för mitt konto:\n",
  },
];

export default function IntegritetPage() {
  return (
    <div>
      <PageHeader
        title="Integritet"
        right={
          <Link href="/min-profil" className="text-sm font-bold text-ink underline underline-offset-4">
            Till profilen
          </Link>
        }
      />
      <main className="space-y-4 px-5 pb-10">
        <div className="rounded-2xl border-2 border-signal bg-rink-line-red p-4 text-sm leading-6 text-ink">
          <strong className="block text-signal">Testuppgifter – byt före skarp lansering</strong>
          Företaget och kontaktadressen på denna sida är fiktiva. E-postknapparna skapar ett
          utkast, men testadressen tar inte emot e-post.
        </div>

        <Card className="p-5">
          <Eyebrow>Personuppgiftsansvarig</Eyebrow>
          <h2 className="mt-1 section-title">{company.name}</h2>
          <dl className="mt-3 space-y-2 text-sm leading-6">
            <div>
              <dt className="font-bold text-ink">Organisationsnummer</dt>
              <dd className="text-ink-subtle">{company.organisationNumber}</dd>
            </div>
            <div>
              <dt className="font-bold text-ink">Kontakt</dt>
              <dd className="text-ink-subtle">{company.email}</dd>
            </div>
            <div>
              <dt className="font-bold text-ink">Adress</dt>
              <dd className="text-ink-subtle">{company.address}</dd>
            </div>
          </dl>
        </Card>

        <Card className="p-5">
          <Eyebrow>Dina uppgifter</Eyebrow>
          <h2 className="mt-1 section-title">Hämta eller kontakta oss</h2>
          <p className="mt-2 text-sm leading-6 text-ink-subtle">
            Exporten är en JSON-fil med de personuppgifter som är kopplade till ditt konto.
            Lösenord och lösenordshash ingår aldrig.
          </p>
          <a
            href="/api/my-data"
            download
            className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-ink px-5 text-base font-bold text-white transition-opacity hover:opacity-90"
          >
            Ladda ner mina uppgifter
          </a>
          <div className="mt-3 grid gap-2">
            {contactActions.map((action) => (
              <a
                key={action.label}
                href={emailHref(action.subject, action.body)}
                className="flex min-h-12 items-center justify-center rounded-xl border border-divider bg-white px-4 py-3 text-center text-sm font-bold text-ink transition-colors hover:bg-rink-crease"
              >
                {action.label} via e-post
              </a>
            ))}
          </div>
          <p className="mt-3 text-xs leading-5 text-ink-subtle">
            Vi bekräftar din identitet innan en begäran hanteras. Svar lämnas normalt inom en
            månad. Radering kan begränsas om uppgifter måste sparas på annan rättslig grund.
          </p>
        </Card>

        <Card className="p-5">
          <Eyebrow>Så använder Istid uppgifter</Eyebrow>
          <div className="mt-3 space-y-4 text-sm leading-6 text-ink-subtle">
            <section>
              <h2 className="font-bold text-ink">Vilka uppgifter?</h2>
              <p>
                Namn, e-post, roll, längd, vikt, fattning, lag, säsong, position och
                tröjnummer. Även anmälningar, frånvaroorsaker, närvaro, matchstatistik och
                höjdpunkter du publicerar kan sparas. Tekniska sessionsuppgifter används för
                säker inloggning.
              </p>
            </section>
            <section>
              <h2 className="font-bold text-ink">Ändamål och rättslig grund</h2>
              <p>
                Konto, profil och lagfunktioner behandlas för att tillhandahålla tjänsten och
                administrera medlemskapet (avtal). Lagplanering, statistik och säkerhet
                behandlas utifrån företagets berättigade intresse av att driva en säker och
                fungerande lagtjänst. Intresset ska dokumenteras och vägas mot användarens
                rättigheter före lansering.
              </p>
            </section>
            <section>
              <h2 className="font-bold text-ink">Mottagare och lagring</h2>
              <p>
                Behöriga lagmedlemmar och administratörer ser de uppgifter som behövs i appen.
                Vercel används för drift och Neon/Postgres för databas. Personuppgiftsbiträdesavtal,
                lagringsregioner och eventuella tredjelandsöverföringar måste kontrolleras i den
                skarpa konfigurationen.
              </p>
            </section>
            <section>
              <h2 className="font-bold text-ink">Hur länge?</h2>
              <p>
                Kontouppgifter sparas medan kontot är aktivt. Säsongsanmälningar och
                registreringar är i denna testpolicy tänkta att raderas eller anonymiseras senast
                12 månader efter säsongens slut. Säkerhetsloggarnas exakta tid måste fastställas
                före lansering. Godkända raderingsbegäranden genomförs utan onödigt dröjsmål.
              </p>
            </section>
            <section>
              <h2 className="font-bold text-ink">Krav, profilering och kakor</h2>
              <p>
                E-post och namn behövs för konto och lagadministration; utan dem kan tjänsten
                inte användas. Övriga spelaruppgifter är frivilliga. Istid använder inte
                automatiserat beslutsfattande eller profilering. Endast nödvändiga
                inloggnings- och sessionskakor används i den här versionen.
              </p>
            </section>
          </div>
        </Card>

        <Card className="p-5">
          <Eyebrow>Dina rättigheter</Eyebrow>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-ink-subtle">
            <li>Få information och tillgång till dina uppgifter.</li>
            <li>Begära rättelse, radering eller begränsning av behandling.</li>
            <li>Invända mot behandling som bygger på berättigat intresse.</li>
            <li>Få ut uppgifter i ett maskinläsbart format när dataportabilitet gäller.</li>
            <li>Lämna klagomål till Integritetsskyddsmyndigheten (IMY).</li>
          </ul>
          <a
            href="https://www.imy.se/privatperson/utfora-arenden/lamna-ett-klagomal/"
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-block text-sm font-bold text-ink underline underline-offset-4"
          >
            Lämna klagomål hos IMY
          </a>
        </Card>

        <Card className="p-5">
          <Eyebrow>Åldersgräns</Eyebrow>
          <h2 className="mt-1 section-title">Endast vuxna, 18+</h2>
          <p className="mt-2 text-sm leading-6 text-ink-subtle">
            Istid är avsedd enbart för personer som har fyllt 18 år. Konton för minderåriga ska
            inte skapas i tjänsten.
          </p>
        </Card>

        <p className="px-1 text-center text-xs leading-5 text-ink-subtle">
          Testversion av integritetsinformation. Senast uppdaterad 13 september 2026.
        </p>
      </main>
    </div>
  );
}
