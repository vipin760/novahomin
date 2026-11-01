/**
 * User Timing helpers for the 3D start-up path. Measures appear in the browser's
 * performance panel as "novahomin:*" and can be read by tests and RUM tooling.
 */
export function mark(name: string) {
  performance.mark(`novahomin:${name}`);
}

export function measure(name: string, from: string, to?: string) {
  try {
    performance.measure(`novahomin:${name}`, `novahomin:${from}`, to ? `novahomin:${to}` : undefined);
  } catch {
    // A start mark can be missing (for example after a fallback); never fail the page for metrics.
  }
}
