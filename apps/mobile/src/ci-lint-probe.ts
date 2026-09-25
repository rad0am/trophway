// Deliberate lint violation to verify CI fails on the Lint step. Do not merge.
export function ciLintProbe() {
  const unusedValue = 1;
  return 2;
}
