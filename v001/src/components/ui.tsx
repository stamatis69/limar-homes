import type { ReactNode } from "react";

export function StateMark({ status, label }: { status: string; label: string }) {
  return <span className={`state state--${status}`}>{label}</span>;
}

export function ChapterHead({ sheet, kicker, title, lead, id }: { sheet: string; kicker?: string; title: ReactNode; lead?: ReactNode; id?: string }) {
  return (
    <header className="chapter-head">
      <span className="sheet-no" aria-hidden="true">
        {sheet}
      </span>
      <div className="stack-3">
        {kicker && <p className="kicker">{kicker}</p>}
        <h2 className="h2" id={id}>
          {title}
        </h2>
        {lead && <p className="lead">{lead}</p>}
      </div>
    </header>
  );
}

export function Metric({ label, value, tbc }: { label: string; value: ReactNode; tbc?: boolean }) {
  return (
    <div className="metric">
      <dt className="label">{label}</dt>
      <dd className="metric-value">
        {value}
        {tbc && (
          <span className="tbc" aria-label="to be confirmed">
            *
          </span>
        )}
      </dd>
    </div>
  );
}

export function TitleBlock({ cells }: { cells: Array<{ label: string; value: ReactNode }> }) {
  return (
    <dl className="titleblock">
      {cells.map((c) => (
        <div key={c.label}>
          <dt className="label">{c.label}</dt>
          <dd>{c.value}</dd>
        </div>
      ))}
    </dl>
  );
}
