const sections = [
  {
    title: "Träningar",
    description: "Se kommande träningar och anmäl dig eller avanmäl dig.",
  },
  {
    title: "Matcher",
    description: "Se matchschema, anmäl deltagande och kommande motståndare.",
  },
  {
    title: "Statistik",
    description: "Mål, assist och utvisningar per spelare och match.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-1 flex-col gap-12 px-6 py-20">
        <header className="flex flex-col gap-3">
          <h1 className="text-4xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Istid
          </h1>
          <p className="max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
            Anmäl dig till träningar och matcher, och följ statistiken för
            laget.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          {sections.map((section) => (
            <div
              key={section.title}
              className="rounded-xl border border-black/[.08] p-5 dark:border-white/[.145]"
            >
              <h2 className="text-lg font-medium text-black dark:text-zinc-50">
                {section.title}
              </h2>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                {section.description}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
