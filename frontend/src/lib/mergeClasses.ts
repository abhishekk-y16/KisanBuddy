export default function mergeClasses(...parts: Array<string | undefined | null | false>) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    if (!p) continue;
    // split by whitespace and preserve order
    for (const token of p.split(/\s+/).filter(Boolean)) {
      if (!seen.has(token)) {
        seen.add(token);
        out.push(token);
      }
    }
  }
  return out.join(' ');
}
