import type { ArchGroup } from "@/lib/engineering";

/**
 * Original layered-architecture diagram: clients, API layer, services, data, all inside cloud
 * infrastructure. `focus` highlights the parts the current principle is about.
 */
export function EngineeringArt({ focus }: { focus: ArchGroup[] }) {
  const on = (group: ArchGroup) => (focus.includes(group) ? "" : undefined);
  const node = (group: ArchGroup, x: number, y: number, w: number, h: number, label: string, extra?: React.ReactNode) => (
    <g className="arch-node" data-on={on(group)}>
      <rect x={x} y={y} width={w} height={h} />
      <text x={x + w / 2} y={y + h / 2 + 4.5} textAnchor="middle">
        {label}
      </text>
      {extra}
    </g>
  );

  return (
    <svg
      className="arch-art"
      viewBox="0 0 400 410"
      role="img"
      aria-label="Layered architecture diagram: web and mobile clients, an API layer with third-party integrations, core, security and automation services, databases and queues, all running on cloud infrastructure with monitoring and deployment."
    >
      <g className="arch-lines" fill="none">
        <path d="M105 64v36M295 64v36M105 144v56M200 144v56M295 144v56M105 256v36M295 256v36" />
      </g>

      <g className="arch-cloud" data-on={on("cloud")}>
        <rect x="8" y="166" width="384" height="232" rx="2" />
        <text x="20" y="184" className="arch-tag">
          CLOUD INFRASTRUCTURE
        </text>
      </g>

      {node("client", 20, 20, 170, 44, "Web application")}
      {node("client", 210, 20, 170, 44, "Mobile app")}
      {node("api", 20, 100, 236, 44, "API layer")}
      {node("integrate", 268, 100, 112, 44, "Integrations")}
      {node("core", 20, 200, 112, 56, "Core services")}
      {node("secure", 144, 200, 112, 56, "Auth & security")}
      {node("ai", 268, 200, 112, 56, "Automation & AI")}
      {node("data", 20, 292, 170, 50, "Database")}
      {node("data", 210, 292, 170, 50, "Cache & queues")}
      {node("ops", 20, 354, 360, 32, "Monitoring · CI/CD · Backups")}
    </svg>
  );
}
