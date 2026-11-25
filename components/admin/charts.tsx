import type { Point } from "@/lib/dashboard";

/** Smooth path through points (monotone-ish Catmull-Rom → cubic Bézier). */
function smooth(points: [number, number][]) {
  if (points.length < 2) return "";
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const mx = (x0 + x1) / 2;
    d += ` C${mx},${y0} ${mx},${y1} ${x1},${y1}`;
  }
  return d;
}

export function Sparkline({ series, tone }: { series: Point[]; tone: "violet" | "blue" | "green" | "amber" }) {
  const w = 120;
  const h = 44;
  const max = Math.max(1, ...series.map((p) => p.count));
  const pts = series.map((p, i): [number, number] => [
    series.length === 1 ? w / 2 : (i / (series.length - 1)) * w,
    h - 4 - (p.count / max) * (h - 10),
  ]);
  const line = smooth(pts);
  return (
    <svg className="adm-spark" data-tone={tone} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <path d={`${line} L${w},${h} L0,${h} Z`} className="adm-spark-fill" />
      <path d={line} className="adm-spark-line" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

const shortDate = (date: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(date));

export function AreaChart({ series, label }: { series: Point[]; label: string }) {
  const w = 640;
  const h = 240;
  const max = Math.max(4, ...series.map((p) => p.count));
  const top = Math.ceil(max / 4) * 4;
  const pts = series.map((p, i): [number, number] => [
    series.length === 1 ? w / 2 : (i / (series.length - 1)) * w,
    h - (p.count / top) * h,
  ]);
  const line = smooth(pts);
  const ticks = [0, 1, 2, 3, 4].map((i) => (top / 4) * i);
  const labelAt = [0, 0.25, 0.5, 0.75, 1].map((f) => series[Math.round(f * (series.length - 1))]);
  return (
    <figure className="adm-chart">
      <div className="adm-chart-plot">
        <ol className="adm-chart-y" aria-hidden="true">
          {[...ticks].reverse().map((tick) => (
            <li key={tick}>{tick}</li>
          ))}
        </ol>
        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label={label}>
          {ticks.map((tick) => (
            <line key={tick} x1="0" x2={w} y1={h - (tick / top) * h} y2={h - (tick / top) * h} className="adm-gridline" vectorEffect="non-scaling-stroke" />
          ))}
          <path d={`${line} L${w},${h} L0,${h} Z`} className="adm-area-fill" />
          <path d={line} className="adm-area-line" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <div className="adm-chart-x" aria-hidden="true">
        {labelAt.map((p, i) => (
          <span key={i}>{shortDate(p.date)}</span>
        ))}
      </div>
      <details className="adm-chart-data">
        <summary>View as table</summary>
        <table>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Enquiries</th>
            </tr>
          </thead>
          <tbody>
            {series.map((p) => (
              <tr key={p.date}>
                <td>{shortDate(p.date)}</td>
                <td>{p.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

const colors = ["#6d28d9", "#3b82f6", "#14b8a6", "#f59e0b", "#cbd5e1"];

export function Donut({ items, total, caption }: { items: { name: string; count: number }[]; total: number; caption: string }) {
  const top = items.slice(0, 4);
  const rest = items.slice(4).reduce((sum, item) => sum + item.count, 0);
  const rows = rest > 0 ? [...top, { name: "Other", count: rest }] : top;
  const r = 52;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="adm-donut">
      <div className="adm-donut-ring">
        <svg viewBox="0 0 140 140" role="img" aria-label={`${caption}: ${total}`}>
          <circle cx="70" cy="70" r={r} fill="none" stroke="#eef0f6" strokeWidth="18" />
          {total > 0
            ? rows.map((row, i) => {
                const len = (row.count / total) * c;
                const circle = (
                  <circle
                    key={row.name}
                    cx="70"
                    cy="70"
                    r={r}
                    fill="none"
                    stroke={colors[i % colors.length]}
                    strokeWidth="18"
                    strokeDasharray={`${Math.max(len - 1.5, 0)} ${c}`}
                    strokeDashoffset={-offset}
                    transform="rotate(-90 70 70)"
                  />
                );
                offset += len;
                return circle;
              })
            : null}
        </svg>
        <div className="adm-donut-center">
          <strong>{total}</strong>
          <span>{caption}</span>
        </div>
      </div>
      <ul className="adm-legend">
        {rows.map((row, i) => (
          <li key={row.name}>
            <span className="adm-swatch" style={{ background: colors[i % colors.length] }} />
            <span className="adm-legend-name">{row.name}</span>
            <b>{total ? Math.round((row.count / total) * 100) : 0}%</b>
          </li>
        ))}
      </ul>
    </div>
  );
}
