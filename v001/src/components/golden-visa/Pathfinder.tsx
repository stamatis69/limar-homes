"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { track } from "@/lib/client/analytics";
import { readJSON, writeJSON } from "@/lib/client/storage";
import type { Dictionary } from "@/lib/i18n";
import { href, type Locale } from "@/lib/i18n/routes";
import { fill, formatRange, loc } from "@/lib/format";
import { activeSteps, evaluate, isComplete, OPTIONS, type ActionKey, type Answers, type InventoryEntry, type Step } from "@/lib/pathfinder";
import type { Localized } from "@/lib/types";

export const PATHFINDER_KEY = "limar.pathfinder.v1";

export interface PathfinderDev extends InventoryEntry {
  name: string;
  locality: Localized;
  sizeMin: number | null;
}

type Dict = Pick<Dictionary, "pathfinder" | "common" | "status">;
type Screen = "intro" | Step | "result";

interface Stored {
  answers: Answers;
  screen: Screen;
}

export function Pathfinder({ locale, dict, developments }: { locale: Locale; dict: Dict; developments: PathfinderDev[] }) {
  const p = dict.pathfinder;
  const [answers, setAnswers] = useState<Answers>({});
  const [screen, setScreen] = useState<Screen>("intro");
  const [hasSaved, setHasSaved] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  // Restore progress after mount: sessionStorage and the URL are not available during SSR.
  /* eslint-disable react-hooks/set-state-in-effect */
  // Restore progress (session only — answers are not personal data, but they are private to this visit).
  useEffect(() => {
    const saved = readJSON<Stored>("session", PATHFINDER_KEY);
    const urlStep = new URLSearchParams(window.location.search).get("step") as Screen | null;
    if (saved?.answers && Object.keys(saved.answers).length) {
      // Returning to ?step=… (e.g. browser Back from a matched development) restores the exact screen.
      if (urlStep && urlStep !== "intro") {
        setAnswers(saved.answers);
        setScreen(urlStep);
        window.history.replaceState({ pf: urlStep }, "", `?step=${urlStep}`);
      } else setHasSaved(true);
    }
    const onPop = (e: PopStateEvent) => {
      const s = (e.state as { pf?: Screen } | null)?.pf;
      if (s) setScreen(s);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (screen === "intro" && !Object.keys(answers).length) return;
    writeJSON("session", PATHFINDER_KEY, { answers, screen });
  }, [answers, screen]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [screen]);

  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const go = useCallback((next: Screen) => {
    // Any explicit navigation cancels a pending auto-advance (e.g. Back pressed right after choosing).
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = null;
    setScreen(next);
    window.history.pushState({ pf: next }, "", `?step=${next}`);
  }, []);

  const steps = activeSteps(answers);
  const stepIndex = steps.indexOf(screen as Step);

  const start = (resume: boolean) => {
    if (resume) {
      const saved = readJSON<Stored>("session", PATHFINDER_KEY);
      if (saved) {
        setAnswers(saved.answers);
        go(isComplete(saved.answers) ? "result" : saved.screen === "intro" ? "objective" : saved.screen);
        return;
      }
    }
    setAnswers({});
    track("golden_visa_pathfinder_start", { locale });
    go("objective");
  };

  const answer = (step: Step, value: string, advance: boolean) => {
    const next = { ...answers, [step]: value } as Answers;
    setAnswers(next);
    track("golden_visa_pathfinder_step", { step });
    if (advance) {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      advanceTimer.current = setTimeout(() => proceed(step, next), 160);
    }
  };

  const proceed = (step: Step, a: Answers = answers) => {
    const list = activeSteps(a);
    const i = list.indexOf(step);
    if (i < list.length - 1) go(list[i + 1]!);
    else {
      const r = evaluate(a, developments);
      track("golden_visa_pathfinder_complete", { outcome: r.outcome });
      track("golden_visa_result", { outcome: r.outcome, route: r.route });
      go("result");
    }
  };

  if (screen === "intro") {
    return (
      <div className="pf">
        <div className="stack-4">
          <p className="kicker">{p.kicker}</p>
          <h2 className="h2" ref={headingRef} tabIndex={-1}>{p.title}</h2>
          <p className="lead">{p.lead}</p>
        </div>
        <div className="cta-row">
          <button type="button" className="btn btn--primary" onClick={() => start(false)}>
            {hasSaved ? p.restart : p.start} <span className="arrow">→</span>
          </button>
          {hasSaved && (
            <button type="button" className="btn" onClick={() => start(true)}>
              {p.resume}
            </button>
          )}
        </div>
        <p className="label">{p.disclaimer}</p>
      </div>
    );
  }

  if (screen === "result") {
    if (!isComplete(answers)) {
      return (
        <div className="pf">
          <button type="button" className="btn" onClick={() => go(steps.find((s) => !answers[s]) ?? "objective")}>{p.resume}</button>
        </div>
      );
    }
    return <Result locale={locale} dict={dict} answers={answers} developments={developments} onEdit={(s) => go(s)} onRestart={() => start(false)} headingRef={headingRef} />;
  }

  const step = screen;
  const q = p.questions[step];
  const current = answers[step];
  return (
    <div className="pf">
      <div className="stack-3">
        <div className="pf-progress" role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={stepIndex + 1} aria-label={fill(p.step, { current: stepIndex + 1, total: steps.length })}>
          <i style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }} />
        </div>
        <p className="label">{fill(p.step, { current: stepIndex + 1, total: steps.length })}</p>
      </div>
      <fieldset className="pf-options" aria-describedby={`pf-q-${step}`}>
        <legend className="h2" style={{ marginBottom: "var(--s-5)" }}>
          <span ref={headingRef} tabIndex={-1} id={`pf-q-${step}`}>{q.title}</span>
        </legend>
        {OPTIONS[step].map((value) => {
          const opt = (q.options as Record<string, { label: string; hint: string }>)[value]!;
          return (
            <label className="pf-option" key={value}>
              <input
                type="radio"
                name={`pf-${step}`}
                value={value}
                checked={current === value}
                onChange={() => answer(step, value, false)}
                onClick={(e) => e.detail > 0 && answer(step, value, true)}
              />
              <span className="box">
                <span className="t">{opt.label}</span>
                {opt.hint && <span className="h">{opt.hint}</span>}
              </span>
            </label>
          );
        })}
      </fieldset>
      <div className="pf-nav">
        <button type="button" className="btn btn--quiet" onClick={() => (stepIndex > 0 ? go(steps[stepIndex - 1]!) : go("intro"))}>
          ← {dict.common.back}
        </button>
        <button type="button" className="btn btn--primary" disabled={!current} onClick={() => proceed(step)}>
          {dict.common.continue} <span className="arrow">→</span>
        </button>
      </div>
    </div>
  );
}

function Result({
  locale,
  dict,
  answers,
  developments,
  onEdit,
  onRestart,
  headingRef,
}: {
  locale: Locale;
  dict: Dict;
  answers: Answers;
  developments: PathfinderDev[];
  onEdit: (s: Step) => void;
  onRestart: () => void;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  const p = dict.pathfinder;
  const r = evaluate(answers, developments);
  const matches = developments.filter((d) => r.matches.includes(d.id));
  const first = matches[0];
  const pfQuery = `&pf=${r.outcome}&route=${r.route}&budget=${answers.budget ?? ""}&loc=${answers.location ?? ""}&prop=${answers.property ?? ""}`;
  const actionHref: Record<ActionKey, string> = {
    viewAvailable: first ? href(locale, `/projects/${first.slug}#residences`) : href(locale, "/projects?status=selling"),
    viewDevelopments: href(locale, "/projects?status=selling"),
    specialist: href(locale, `/enquire?interest=golden-visa&source=pathfinder${first ? `&development=${first.id}` : ""}${pfQuery}`),
    consultation: href(locale, `/enquire?interest=investment&source=pathfinder${pfQuery}`),
    explore: href(locale, "/projects"),
    learn: href(locale, "/golden-visa"),
  };
  const answerLabel = (s: Step) => {
    const v = answers[s];
    if (!v) return null;
    return (p.questions[s].options as Record<string, { label: string }>)[v]?.label ?? v;
  };

  return (
    <div className="pf-result" data-outcome={r.outcome}>
      <section className="pf-outcome" data-outcome={r.outcome} aria-labelledby="pf-outcome-title">
        <p className="kicker">{p.kicker}</p>
        <h2 className="h2" id="pf-outcome-title" ref={headingRef} tabIndex={-1}>
          {p.outcomes[r.outcome].title}
        </h2>
        <p className="lead">{p.outcomes[r.outcome].tone}</p>
        <dl className="facts">
          <dt className="label">{p.sections.route}</dt>
          <dd>{p.routes[r.route]}</dd>
        </dl>
      </section>

      <div className="split">
        <section className="pf-block" aria-labelledby="pf-why">
          <h3 className="label" id="pf-why">{p.sections.why}</h3>
          <ul>{r.reasons.map((k) => <li key={k}>{p.reasons[k]}</li>)}</ul>
        </section>
        <section className="pf-block" aria-labelledby="pf-guidance">
          <h3 className="label" id="pf-guidance">{p.sections.guidance}</h3>
          <ul>{r.guidance.map((k) => <li key={k}>{p.guidance[k]}</li>)}</ul>
        </section>
      </div>

      <div className="split">
        {r.limits.length > 0 && (
          <section className="pf-block notice" aria-labelledby="pf-limits">
            <h3 className="label" id="pf-limits">{p.sections.limits}</h3>
            <ul>{r.limits.map((k) => <li key={k}>{p.reasons[k]}</li>)}</ul>
          </section>
        )}
        <section className="pf-block" aria-labelledby="pf-open">
          <h3 className="label" id="pf-open">{p.sections.open}</h3>
          <ul>{r.open.map((k) => <li key={k}>{p.open[k]}</li>)}</ul>
        </section>
      </div>

      <section className="pf-block" aria-labelledby="pf-matches">
        <h3 className="label" id="pf-matches">{p.sections.matches}</h3>
        {matches.length === 0 ? (
          <p className="muted">{p.sections.noMatches}</p>
        ) : (
          <ul className="pf-matches plain-list">
            {matches.map((d) => (
              <li key={d.id} className="pf-match">
                <div>
                  <p className="h3">{d.name}</p>
                  <p className="muted">
                    {loc(d.locality, locale)} ·{" "}
                    {d.available == null ? p.matchPending : fill(p.matchReason, { count: d.available, size: formatRange(d.sizeMin, d.sizeMax, locale) })}
                  </p>
                </div>
                <Link className="btn btn--small" href={href(locale, `/projects/${d.slug}#residences`)}>
                  {p.actions.viewAvailable}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="pf-block" aria-labelledby="pf-next" style={{ borderTop: "1px solid var(--ink)", paddingTop: "var(--s-5)" }}>
        <h3 className="label" id="pf-next">{p.sections.next}</h3>
        <div className="cta-row">
          {r.actions.map((a) =>
            a.primary ? (
              <Link key={a.key} className="btn btn--primary" href={actionHref[a.key]}>
                {p.actions[a.key]} <span className="arrow">→</span>
              </Link>
            ) : (
              <Link key={a.key} className="link-arrow" href={actionHref[a.key]}>
                {p.actions[a.key]}
              </Link>
            ),
          )}
        </div>
      </section>

      <section className="pf-block" aria-labelledby="pf-answers">
        <h3 className="label" id="pf-answers">{p.sections.answers}</h3>
        <ul className="answers-list plain-list">
          {activeSteps(answers).map((s) => (
            <li key={s}>
              <button type="button" onClick={() => onEdit(s)} style={{ background: "none", border: 0, padding: 0 }} aria-label={`${dict.common.edit}: ${p.questions[s].title} — ${answerLabel(s)}`}>
                {answerLabel(s)} ✎
              </button>
            </li>
          ))}
        </ul>
        <div className="cta-row">
          <button type="button" className="btn btn--small btn--quiet" onClick={() => onEdit("objective")}>{p.editAnswers}</button>
          <button type="button" className="btn btn--small btn--quiet" onClick={onRestart}>{p.restart}</button>
        </div>
      </section>
      <p className="label" style={{ maxWidth: "60em" }}>{p.disclaimer}</p>
    </div>
  );
}
