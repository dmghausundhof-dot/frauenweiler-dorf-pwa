import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  MapPin,
  FileText,
  ExternalLink,
  ArrowLeft,
  BookOpen,
  Hash,
  Lightbulb,
  Link2,
  CalendarDays,
  BarChart3,
  Layers,
  Quote,
  ArrowRightLeft,
} from 'lucide-react';
import {
  historyPdfSources,
  historyTimeline,
  historyThemeBlocks,
  historyPageAnchors,
  historyFactCards,
  historyWorthKnowing,
  historyFurtherLinks,
  historyYearSpotlights,
  historyChronicle50,
  historyChronicle75,
  historyEditionComparison,
  historyMilestoneTable,
} from '@/lib/dorfapp/history-content';

export const metadata: Metadata = {
  title: 'Geschichte | Frauenweiler DorfApp',
  description:
    'Zeitstrahl, Themen, Zahlen und Chroniken zur Geschichte Frauenweilers – mit PDF-Links zu den Vereinsbroschüren 1987 und 2012.',
  keywords: [
    'Frauenweiler',
    'Wiesloch',
    'Geschichte',
    'Chronik',
    'Stadtteilverein',
    'Siedlerbund',
  ],
};

export default function GeschichtePage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white/95 backdrop-blur safe-area-pt">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#166534] hover:underline"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            Zur DorfApp
          </Link>
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Beispielseite</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 pb-16">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#dcfce7] px-3 py-1 text-xs font-semibold text-[#14532d]">
          <MapPin className="h-3.5 w-3.5" aria-hidden />
          Wiesloch-Frauenweiler
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">Geschichte des Ortes</h1>
        <p className="mt-4 max-w-prose text-base leading-relaxed text-zinc-600">
          Diese Seite zeigt, wie sich Dorfgeschichte in der DorfApp strukturieren lässt: Chroniken als PDF, ein kompakter
          Zeitstrahl, Faktenkarten, Lesetipps zu einzelnen Jahren, thematische Kapitel mit Bildern aus den
          Vereinsbroschüren und Links für den Alltag vor Ort. Die Kurztexte sind redaktionell zusammengefasst; Detailtiefe
          und Urheberrecht bleiben bei den Originaldokumenten auf{' '}
          <a href="https://frauenweiler.org/" className="font-medium text-[#166534] underline underline-offset-2">
            frauenweiler.org
          </a>
          .
        </p>

        <nav
          className="mt-8 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
          aria-label="Abschnitte auf dieser Seite"
        >
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <Hash className="h-3.5 w-3.5 text-[#166534]" aria-hidden />
            Auf dieser Seite
          </div>
          <ul className="mt-3 flex flex-wrap gap-2">
            {historyPageAnchors.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:border-[#166534]/40 hover:bg-[#f0fdf4] hover:text-[#14532d]"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* PDF-Quellen */}
        <section id="chroniken" className="mt-12 scroll-mt-24" aria-labelledby="geschichte-h-chroniken">
          <h2 id="geschichte-h-chroniken" className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
            <FileText className="h-5 w-5 text-[#166534]" aria-hidden />
            Chroniken als PDF
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            Beide Broschüren stehen beim Stadtteilverein zum Download bereit (hochauflösend, viele Seiten). Zum Lesen am
            PC oder Tablet eignen sich die Dateien besonders gut; unterwegs nutzt du die Kurzfassungen hier.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {historyPdfSources.map((src) => (
              <a
                key={src.id}
                href={src.href}
                target="_blank"
                rel="noopener noreferrer"
                className="dorf-card group flex flex-col p-5 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-[#166534]">{src.yearLabel}</div>
                    <h3 className="mt-1 text-base font-semibold text-zinc-900 group-hover:text-[#14532d]">{src.title}</h3>
                  </div>
                  <ExternalLink className="h-4 w-4 shrink-0 text-zinc-400 group-hover:text-[#166534]" aria-hidden />
                </div>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600">{src.description}</p>
                <div className="mt-4 text-xs text-zinc-500">{src.pages} Seiten · PDF</div>
              </a>
            ))}
          </div>
        </section>

        {/* Chronik-Editionen: Festschrift & überarbeitete Ausgabe */}
        <section id="editionen" className="mt-14 scroll-mt-24" aria-labelledby="geschichte-h-editionen">
          <h2 id="geschichte-h-editionen" className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
            <Layers className="h-5 w-5 text-[#166534]" aria-hidden />
            Festschrift 1987 &amp; Chronik 2012 im Überblick
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            Kapitelfokus und Schwerpunkte – Auszugsweise und paraphrasiert nach den PDFs beim{' '}
            <a href="https://frauenweiler.org/" className="font-medium text-[#166534] underline underline-offset-2">
              Stadtteilverein
            </a>
            . Für Zitate und Fotorechte gilt jeweils die Originalpublikation.
          </p>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {[historyChronicle50, historyChronicle75].map((edition) => (
              <article key={edition.id} className="dorf-card overflow-hidden flex flex-col">
                {edition.coverImageSrc && edition.coverImageAlt && (
                  <div className="relative aspect-[16/10] border-b border-zinc-100 bg-zinc-100">
                    <Image
                      src={edition.coverImageSrc}
                      alt={edition.coverImageAlt}
                      width={800}
                      height={500}
                      className="h-full w-full object-cover object-center"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#166534]">
                    {edition.publisherLine}
                  </div>
                  <h3 className="mt-1 text-lg font-semibold text-zinc-900">{edition.displayTitle}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">{edition.intro}</p>
                  <h4 className="mt-4 text-xs font-bold uppercase tracking-wide text-zinc-500">Kapitelüberblicke</h4>
                  <ul className="mt-2 space-y-3 text-sm">
                    {edition.chapterHighlights.map((ch) => (
                      <li key={ch.headline} className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-3">
                        <div className="font-semibold text-zinc-900">{ch.headline}</div>
                        <p className="mt-1 text-zinc-600 leading-relaxed">{ch.takeaway}</p>
                        {ch.tags && ch.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {ch.tags.map((t) => (
                              <span
                                key={t}
                                className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-[#166534]"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                  {edition.notableQuotes && edition.notableQuotes.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-zinc-500">
                        <Quote className="h-3.5 w-3.5 text-[#166534]" aria-hidden />
                        Kurz zitierte Töne
                      </h4>
                      <ul className="space-y-2">
                        {edition.notableQuotes.map((q) => (
                          <li
                            key={q.phrase}
                            className="rounded-xl border border-[#166534]/15 bg-[#f0fdf4]/60 px-3 py-2 text-sm"
                          >
                            <blockquote className="font-medium italic text-[#14532d]">{q.phrase}</blockquote>
                            <p className="mt-1 text-xs leading-relaxed text-zinc-600">{q.summary}</p>
                            <p className="mt-1 text-[11px] text-zinc-500">
                              {q.speaker} · {q.via}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-4">
                    <a
                      href={edition.pdfHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-[#166534] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#14532d]"
                    >
                      PDF öffnen
                      <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
                    </a>
                    <span className="text-xs text-zinc-500">{edition.pageCount} Seiten</span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 dorf-card p-5" aria-labelledby="geschichte-vergleich">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <ArrowRightLeft className="h-4 w-4 text-[#166534]" aria-hidden />
              <span id="geschichte-vergleich">Schneller Lese-Vergleich</span>
            </div>
            <p className="mt-2 text-sm text-zinc-600">
              Grobe Orientierung zwischen den beiden Druckzyklen – ideal, bevor Du Seiten anklickst.
            </p>
            <dl className="mt-4 space-y-4">
              {historyEditionComparison.map((row) => (
                <div
                  key={row.aspect}
                  className="grid gap-3 rounded-xl border border-zinc-100 bg-white p-4 sm:grid-cols-[minmax(0,140px)_1fr_1fr]"
                >
                  <dt className="text-xs font-bold uppercase tracking-wide text-zinc-500 sm:pt-0.5">{row.aspect}</dt>
                  <div>
                    <div className="text-[11px] font-semibold text-[#166534]">Festschrift&nbsp;1987</div>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-700">{row.circa1987}</p>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-[#166534]">Chronik&nbsp;2012</div>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-700">{row.circa2012}</p>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section id="meilensteine" className="mt-14 scroll-mt-24" aria-labelledby="geschichte-h-milestones">
          <h2 id="geschichte-h-milestones" className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
            <CalendarDays className="h-5 w-5 text-[#166534]" aria-hidden />
            Meilensteine (überblicksweise)
          </h2>
          <p className="mt-2 max-w-prose text-sm text-zinc-600">
            Tabelle zur schnellen Einordnung. Jahreszahl und Kurzdarstellung sind bewusst knapp gehalten und mit der
            angegeben Quelle gekoppelt – für Narrative weiter die PDF-Chroniken nutzen.
          </p>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm [-webkit-overflow-scrolling:touch]">
            <table className="min-w-[560px] w-full border-collapse text-left text-sm">
              <caption className="sr-only">
                Überblicksliste bedeutsamer Daten in der Geschichte Frauenweilers
              </caption>
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th scope="col" className="whitespace-nowrap px-4 py-3 font-semibold text-zinc-800">
                    Jahr / Zeitraum
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-zinc-800">
                    Kurzbezug
                  </th>
                  <th scope="col" className="hidden sm:table-cell px-4 py-3 font-semibold text-zinc-800">
                    Quellenhinweis
                  </th>
                </tr>
              </thead>
              <tbody>
                {historyMilestoneTable.map((row) => (
                  <tr key={`${row.year}-${row.title}`} className="border-b border-zinc-100 last:border-0">
                    <td className="align-top whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-[#166534]">
                      {row.year}
                    </td>
                    <td className="align-top px-4 py-3 text-zinc-700">
                      <div className="font-semibold text-zinc-900">{row.title}</div>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-600">{row.detail}</p>
                      <p className="mt-2 text-xs text-zinc-500 sm:hidden">
                        <span className="font-medium text-zinc-600">Quelle: </span>
                        {row.attribution}
                      </p>
                    </td>
                    <td className="hidden align-top px-4 py-3 text-xs text-zinc-500 sm:table-cell">
                      {row.attribution}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Zahlen & Jahresblicke */}
        <section id="zahlen" className="mt-14 scroll-mt-24" aria-labelledby="geschichte-h-zahlen">
          <h2 id="geschichte-h-zahlen" className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
            <BarChart3 className="h-5 w-5 text-[#166534]" aria-hidden />
            Zahlen &amp; Fakten
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            Schneller Überblick – für Belege und Bildnachweise weiterhin die PDF-Chroniken heranziehen.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {historyFactCards.map((card, i) => (
              <div key={i} className="dorf-card p-4">
                <div className="font-mono text-2xl font-semibold tracking-tight text-[#166534]">{card.value}</div>
                <div className="mt-1 text-sm font-semibold text-zinc-900">{card.label}</div>
                {card.hint && <p className="mt-2 text-xs leading-relaxed text-zinc-500">{card.hint}</p>}
              </div>
            ))}
          </div>

          <h3
            id="geschichte-h-jahre"
            className="mt-10 flex items-center gap-2 text-base font-semibold text-zinc-900"
          >
            <CalendarDays className="h-4 w-4 text-[#166534]" aria-hidden />
            Jahre im Überblick
          </h3>
          <p className="mt-2 text-sm text-zinc-600">
            Stichpunkte zum gezielten Nachlesen in den Chroniken – besonders hilfreich vor einem Gespräch oder einer
            Stadtteilführung.
          </p>
          <ul className="mt-4 space-y-3" aria-labelledby="geschichte-h-jahre">
            {historyYearSpotlights.map((row) => (
              <li key={row.year} className="dorf-card flex gap-4 p-4 sm:items-start">
                <div className="shrink-0 rounded-xl bg-[#dcfce7] px-3 py-2 text-center">
                  <div className="font-mono text-xs font-bold uppercase text-[#14532d]">{row.year}</div>
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-zinc-900">{row.title}</div>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-600">{row.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Zeitstrahl */}
        <section id="zeitstrahl" className="mt-14 scroll-mt-24" aria-labelledby="geschichte-h-zeitstrahl">
          <h2 id="geschichte-h-zeitstrahl" className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
            <BookOpen className="h-5 w-5 text-[#166534]" aria-hidden />
            Zeitstrahl
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            Von der mittelalterlichen Weilersiedlung bis zur erweiterten Chronik 2012 – in groben Schritten, dafür gut
            lesbar auf dem Handy.
          </p>
          <ol className="relative mt-8 border-l-2 border-[#166534]/25 pl-8">
            {historyTimeline.map((entry, i) => (
              <li key={i} className="relative pb-12 last:pb-2">
                <span className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full border-2 border-[#166534] bg-white" />
                <div className="font-mono text-sm font-semibold text-[#166534]">{entry.year}</div>
                <h3 className="mt-1 text-lg font-semibold text-zinc-900">{entry.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{entry.body}</p>
                {entry.imageSrc && entry.imageAlt && (
                  <figure className="mt-4 max-w-sm overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
                    <Image
                      src={entry.imageSrc}
                      alt={entry.imageAlt}
                      width={640}
                      height={427}
                      className="h-auto w-full object-cover"
                      sizes="(max-width: 640px) 90vw, 384px"
                    />
                    <figcaption className="border-t border-zinc-100 bg-white px-3 py-2 text-xs text-zinc-500">
                      {entry.imageAlt}
                    </figcaption>
                  </figure>
                )}
              </li>
            ))}
          </ol>
        </section>

        {/* Wissenswertes */}
        <section id="wissen" className="mt-14 scroll-mt-24" aria-labelledby="geschichte-h-wissen">
          <h2 id="geschichte-h-wissen" className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
            <Lightbulb className="h-5 w-5 text-[#166534]" aria-hidden />
            Wissenswertes
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            Häufige Fragen und Zusammenhänge – als Einstieg, nicht als Ersatz für die ausführlichen Kapitel in den PDFs.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {historyWorthKnowing.map((item, i) => (
              <article key={i} className="dorf-card p-5">
                <h3 className="text-base font-semibold text-zinc-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Themenblöcke */}
        <section id="themen" className="mt-14 scroll-mt-24 space-y-10" aria-labelledby="geschichte-h-themen">
          <h2 id="geschichte-h-themen" className="text-lg font-semibold text-zinc-900">
            Themen
          </h2>
          <p className="-mt-6 text-sm text-zinc-600">
            Vertiefung mit Abbildungen aus den Broschüren – jeweils ein Schwerpunkt, den die Chroniken breiter ausrollen.
          </p>
          {historyThemeBlocks.map((block, i) => (
            <article
              key={i}
              className={`dorf-card overflow-hidden sm:grid ${block.imageSrc ? 'sm:grid-cols-[minmax(0,200px)_1fr] sm:gap-0' : ''}`}
            >
              {block.imageSrc && block.imageAlt && (
                <div className="relative aspect-[4/3] max-h-44 border-b border-zinc-100 bg-zinc-100 sm:aspect-auto sm:max-h-none sm:min-h-0 sm:border-b-0 sm:border-r">
                  <Image
                    src={block.imageSrc}
                    alt={block.imageAlt}
                    width={480}
                    height={360}
                    className="h-full w-full object-cover object-center"
                    sizes="(max-width: 640px) 100vw, 200px"
                  />
                </div>
              )}
              <div className="p-6 sm:flex sm:flex-col sm:justify-center">
                <h3 className="text-xl font-semibold text-zinc-900">{block.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{block.lead}</p>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                  {block.bullets.map((b, j) => (
                    <li key={j}>{b}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </section>

        {/* Weiterlesen */}
        <section id="weiter" className="mt-14 scroll-mt-24" aria-labelledby="geschichte-h-weiter">
          <h2 id="geschichte-h-weiter" className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
            <Link2 className="h-5 w-5 text-[#166534]" aria-hidden />
            Weiterlesen &amp; vor Ort
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            Verknüpfungen aus der DorfApp und aus dem offiziellen Umfeld – damit Geschichte nicht isoliert bleibt.
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {historyFurtherLinks.map((item) => (
              <li key={item.href + item.label}>
                {item.external ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dorf-card flex h-full flex-col p-4 transition-shadow hover:shadow-md"
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-zinc-900">{item.label}</span>
                      <ExternalLink className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
                    </span>
                    <span className="mt-2 text-sm leading-relaxed text-zinc-600">{item.description}</span>
                  </a>
                ) : (
                  <Link
                    href={item.href}
                    className="dorf-card flex h-full flex-col p-4 transition-shadow hover:shadow-md"
                  >
                    <span className="font-semibold text-zinc-900">{item.label}</span>
                    <span className="mt-2 text-sm leading-relaxed text-zinc-600">{item.description}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>

        <footer className="mt-14 rounded-2xl border border-zinc-200 bg-white p-5 text-xs leading-relaxed text-zinc-500">
          <strong className="text-zinc-700">Hinweis:</strong> Bilder auf dieser Seite sind Ausschnitte aus den genannten
          Vereins-PDFs (Farbe/Kompression für die Webdarstellung angepasst). Für wissenschaftliche oder publizistische
          Nutzung bitte das{' '}
          <a href="https://frauenweiler.org/" className="text-[#166534] underline">
            Stadtteilverein Frauenweiler
          </a>{' '}
          kontaktieren. Technisch ließe sich dieselbe Struktur später aus Supabase laden (CMS mit Rich Text, Medien-Bucket
          und Redaktionsrollen).
        </footer>
      </main>
    </div>
  );
}
