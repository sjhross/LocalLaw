// Parses the operative text of each clause out of the extracted PDF text.
// Run: node extract-clause-text.mjs   → data/clause-text.json
import { readFileSync, writeFileSync } from "node:fs";

const raw = readFileSync("reference/General_Local_Law_2018_extracted_text.txt", "utf8");

// The table of contents runs to page 6; operative text starts at page 7.
const body = raw.slice(raw.indexOf("===== PAGE 7 ====="));

const NOISE = [
  /^===== PAGE \d+ =====$/,
  /^City of Stonnington\s+General Local Law 2018 \(No\.1\) AMENDMENT$/,
  /^[A-D0-9]{1,3} City of Stonnington\s+General Local Law 2018 \(No\.1\) AMENDMENT$/,
  /^City of Stonnington General Local Law 2018 \(No\.1\)$/,
  /^GENERAL LOCAL LAW 2018$/,
  /^Par ?t \d+ ?[–-]\s*$/,
  /^Part \d+\s*[–-]\s*$/,
  /^This page\s*$/, /^has intentionally\s*$/, /^been left blank$/,
  /^\d{1,3}$/, /^[A-D]$/,
];

const lines = body
  .split("\n")
  .map((l) => l.replace(/\s+$/, ""))
  .filter((l) => !NOISE.some((r) => r.test(l.trim())));

const text = lines.join("\n");

const clauses = readFileSync("data/clauses.psv", "utf8")
  .split("\n")
  .filter((l) => l.trim() && !l.startsWith("#"))
  .map((l) => {
    const [, , id, title] = l.split("|");
    return { id: id.trim(), title: title.trim() };
  });

// Headings sit at the start of a line as "12. Title", sometimes with the title
// wrapped across lines, so anchor on the number and slice to the next heading.
const out = {};
const idx = [];
for (const c of clauses) {
  const re = new RegExp("^" + c.id + "\\.\\s", "m");
  let from = idx.length ? idx[idx.length - 1].at + 1 : 0;
  const m = re.exec(text.slice(from));
  if (!m) { idx.push({ id: c.id, at: from, missing: true }); continue; }
  idx.push({ id: c.id, at: from + m.index });
}

for (let i = 0; i < idx.length; i++) {
  const here = idx[i];
  if (here.missing) { out[here.id] = ""; continue; }
  const next = idx.slice(i + 1).find((x) => !x.missing);
  let chunk = text.slice(here.at, next ? next.at : text.length);
  chunk = chunk
    .replace(/^\d{1,3}\.\s*/, "")            // drop the number, keep the heading words
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\(1 (\d)\)/g, "($1$2)")        // "(1 0)" is a mangled "(10)"
    .replace(/Par ?t 1 ?1/g, "Part 11")
    .trim();
  out[here.id] = chunk;
}

// Table 2 sets the prohibited hours for cl.144(7) but is printed on the page
// belonging to cl.145. Left there, a noise answer either misses it or cites it
// as cl.145, so move it to the clause that actually relies on it.
const T2 = "\nTable 2\n";
for (const id of Object.keys(out)) {
  const at = out[id].indexOf(T2);
  if (at === -1) continue;
  const table = out[id].slice(at + 1).trim();
  out[id] = out[id].slice(0, at).trim();
  out["144"] += "\n\nTable 2 — referred to in sub-clause (7) above.\n" + table.replace(/^Table 2\n/, "");
}

// The last clause runs on into Schedule 5 (the procedural motions table),
// which belongs to the Governance Rules, not to the operative law.
const last = clauses[clauses.length - 1].id;
out[last] = out[last].split(/\n(?=Procedural Motions|Schedule 5|SCHEDULE 5|Motion\b.*\n)/)[0]
  .replace(/\n[^\n]*Debate\n[\s\S]*$/, "")
  .trim();

writeFileSync("data/clause-text.json", JSON.stringify(out, null, 0));

const empty = Object.entries(out).filter(([, v]) => v.length < 40).map(([k]) => k);
const long = Object.entries(out).sort((a, b) => b[1].length - a[1].length).slice(0, 3);
console.log(`${Object.keys(out).length} clauses, ${Math.round(JSON.stringify(out).length / 1024)} KB`);
console.log("suspiciously short:", empty.length ? empty.join(", ") : "none");
console.log("longest:", long.map(([k, v]) => `cl.${k} ${v.length}`).join(", "));
