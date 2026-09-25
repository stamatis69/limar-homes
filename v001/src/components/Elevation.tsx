import type { DrawingSpec } from "@/lib/types";

export interface FloorMeta {
  floor: number;
  available: number;
  total: number;
}

interface Props {
  spec: DrawingSpec;
  title: string;
  caption?: string;
  /** Show level markers and per-floor availability (explorer mode). */
  floorMeta?: FloorMeta[];
  selectedFloor?: number | null;
  onFloorSelect?: (floor: number) => void;
  animate?: boolean;
  compact?: boolean;
  className?: string;
}

const BAY = 64;
const FLOOR_H = 44;
const GROUND_H = 52;
const SIDE = 96;
const TOP = 56;
const BOTTOM = 64;

/**
 * Schematic elevation generated from verified development parameters.
 * It is a diagram (labelled as such), never a representation of the real façade.
 */
export function Elevation({ spec, title, caption, floorMeta, selectedFloor = null, onFloorSelect, animate = true, compact = false, className }: Props) {
  const bw = spec.bays * BAY + 24;
  const width = bw + SIDE * 2;
  const bodyH = GROUND_H + spec.floors * FLOOR_H;
  const roofH = spec.roof === "terrace" ? 26 : 10;
  const height = TOP + roofH + bodyH + BOTTOM;
  const x0 = SIDE;
  const groundY = TOP + roofH + bodyH;
  const floorTop = (f: number) => groundY - GROUND_H - f * FLOOR_H; // top edge of floor f (1-based)
  const interactive = Boolean(onFloorSelect);
  const metaByFloor = new Map((floorMeta ?? []).map((m) => [m.floor, m]));

  const bands = [];
  for (let f = 1; f <= spec.floors; f++) {
    const y = floorTop(f);
    const meta = metaByFloor.get(f);
    const isSelected = selectedFloor === f;
    const hasAvail = meta ? meta.available > 0 : false;
    bands.push(
      <g
        key={f}
        className={`elev-floor${isSelected ? " is-selected" : ""}${meta && !hasAvail ? " is-full" : ""}`}
        onClick={interactive ? () => onFloorSelect?.(f) : undefined}
        data-floor={f}
      >
        <rect className="elev-band" x={x0} y={y} width={bw} height={FLOOR_H} pathLength={1} />
        {Array.from({ length: spec.bays }).map((_, b) => {
          const wx = x0 + 12 + b * BAY + 10;
          return (
            <g key={b}>
              <rect className="elev-window" x={wx} y={y + 9} width={BAY - 20} height={FLOOR_H - 14} pathLength={1} />
              <line className="elev-mullion" x1={wx + (BAY - 20) / 2} y1={y + 9} x2={wx + (BAY - 20) / 2} y2={y + FLOOR_H - 5} pathLength={1} />
              {b % 2 === 0 && <rect className="elev-rail" x={wx - 5} y={y + FLOOR_H - 13} width={BAY - 10} height={13} />}
            </g>
          );
        })}
        <line className="elev-slab" x1={x0 - 10} y1={y + FLOOR_H} x2={x0 + bw + 10} y2={y + FLOOR_H} pathLength={1} />
        {meta && (
          <text className="elev-meta" x={x0 + bw + 22} y={y + FLOOR_H / 2 + 4}>
            {meta.available}/{meta.total}
          </text>
        )}
        <text className="elev-level" x={x0 - 22} y={y + FLOOR_H / 2 + 4} textAnchor="end">
          {f}
        </text>
      </g>,
    );
  }

  // Ground level
  const gy = groundY - GROUND_H;
  const groundMeta = metaByFloor.get(0);
  const ground = (
    <g
      className={`elev-ground${groundMeta ? " elev-floor" : ""}${selectedFloor === 0 ? " is-selected" : ""}${groundMeta && groundMeta.available === 0 ? " is-full" : ""}`}
      onClick={interactive && groundMeta ? () => onFloorSelect?.(0) : undefined}
      data-floor={0}
    >
      <rect className="elev-band" x={x0} y={gy} width={bw} height={GROUND_H} pathLength={1} />
      {spec.ground === "pilotis" &&
        Array.from({ length: spec.bays + 1 }).map((_, i) => (
          <line key={i} className="elev-pilotis" x1={x0 + 12 + i * BAY} y1={gy} x2={x0 + 12 + i * BAY} y2={groundY} pathLength={1} />
        ))}
      {spec.ground === "retail" && (
        <rect className="elev-window" x={x0 + 14} y={gy + 10} width={bw - 28} height={GROUND_H - 10} pathLength={1} />
      )}
      {spec.ground === "garden" && (
        <>
          <line className="elev-mullion" x1={x0 + bw / 2 - 18} y1={gy + 12} x2={x0 + bw / 2 - 18} y2={groundY} pathLength={1} />
          <line className="elev-mullion" x1={x0 + bw / 2 + 18} y1={gy + 12} x2={x0 + bw / 2 + 18} y2={groundY} pathLength={1} />
          <line className="elev-mullion" x1={x0 + bw / 2 - 18} y1={gy + 12} x2={x0 + bw / 2 + 18} y2={gy + 12} pathLength={1} />
        </>
      )}
      {groundMeta && (
        <text className="elev-meta" x={x0 + bw + 22} y={gy + GROUND_H / 2 + 4}>
          {groundMeta.available}/{groundMeta.total}
        </text>
      )}
      <text className="elev-level" x={x0 - 22} y={gy + GROUND_H / 2 + 4} textAnchor="end">
        0
      </text>
    </g>
  );

  // Roof
  const roofY = floorTop(spec.floors);
  const roof = (
    <g className="elev-roof">
      <line className="elev-slab" x1={x0 - 6} y1={roofY} x2={x0 + bw + 6} y2={roofY} pathLength={1} />
      <rect className="elev-parapet" x={x0} y={roofY - 10} width={bw} height={10} pathLength={1} />
      {spec.roof === "terrace" && (
        <>
          <rect className="elev-band" x={x0 + bw * 0.55} y={roofY - roofH} width={bw * 0.3} height={roofH - 10} pathLength={1} />
          {spec.features.includes("pergola") &&
            Array.from({ length: 8 }).map((_, i) => (
              <line key={i} className="elev-mullion" x1={x0 + 10 + i * ((bw * 0.5) / 8)} y1={roofY - roofH + 2} x2={x0 + 10 + i * ((bw * 0.5) / 8)} y2={roofY - 10} pathLength={1} />
            ))}
          {spec.features.includes("pergola") && (
            <line className="elev-slab" x1={x0 + 6} y1={roofY - roofH + 2} x2={x0 + bw * 0.52} y2={roofY - roofH + 2} pathLength={1} />
          )}
        </>
      )}
    </g>
  );

  // Site context
  const context = (
    <g className="elev-context">
      <line className="elev-groundline" x1={8} y1={groundY} x2={width - 8} y2={groundY} pathLength={1} />
      {Array.from({ length: Math.floor((width - 16) / 14) }).map((_, i) => (
        <line key={i} className="elev-hatch" x1={12 + i * 14} y1={groundY + 1} x2={4 + i * 14} y2={groundY + 9} />
      ))}
      {spec.features.includes("garden") && (
        <>
          <Tree x={SIDE * 0.45} y={groundY} r={20} />
          <Tree x={width - SIDE * 0.42} y={groundY} r={16} />
        </>
      )}
      {spec.features.includes("sea") &&
        [0, 1, 2].map((i) => (
          <path
            key={i}
            className="elev-sea"
            d={`M ${x0 + bw + 18} ${groundY - 10 - i * 7} q 8 -4 16 0 t 16 0 t 16 0 t 16 0`}
            pathLength={1}
          />
        ))}
      {spec.features.includes("pool") && (
        <g>
          <rect className="elev-pool" x={8} y={groundY - 7} width={SIDE - 22} height={7} />
          <line className="elev-mullion" x1={8} y1={groundY - 7} x2={SIDE - 14} y2={groundY - 7} pathLength={1} />
        </g>
      )}
    </g>
  );

  // Vertical dimension line (overall height in levels)
  const dim = !compact && (
    <g className="elev-dim">
      <line x1={x0 - 48} y1={roofY} x2={x0 - 48} y2={groundY} pathLength={1} />
      <line x1={x0 - 54} y1={roofY} x2={x0 - 42} y2={roofY} />
      <line x1={x0 - 54} y1={groundY} x2={x0 - 42} y2={groundY} />
      <line x1={x0} y1={groundY + 26} x2={x0 + bw} y2={groundY + 26} pathLength={1} />
      <line x1={x0} y1={groundY + 20} x2={x0} y2={groundY + 32} />
      <line x1={x0 + bw} y1={groundY + 20} x2={x0 + bw} y2={groundY + 32} />
    </g>
  );

  return (
    <figure className={`elevation${animate ? " is-animated" : ""}${interactive ? " is-interactive" : ""}${className ? ` ${className}` : ""}`}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title} preserveAspectRatio="xMidYMax meet">
        <title>{title}</title>
        {context}
        {ground}
        {bands}
        {roof}
        {dim}
      </svg>
      {caption && <figcaption className="elevation-caption">{caption}</figcaption>}
    </figure>
  );
}

function Tree({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g className="elev-tree">
      <line x1={x} y1={y} x2={x} y2={y - r * 1.3} pathLength={1} />
      <circle cx={x} cy={y - r * 1.9} r={r} pathLength={1} />
    </g>
  );
}
