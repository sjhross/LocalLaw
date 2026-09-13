// Builds dist/control-room.html by inlining data/ into src/app.html.
// Run: node build.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(join(root, p), "utf8");
const readJson = (p) => JSON.parse(read(p));

// Business unit that owns each Part of the current law, agreed at the
// first clause workshop. Part 4 was repealed in 2023.
const PART_OWNER = {
  1: "Governance & Legal",
  2: "Governance & Legal",
  3: "Governance & Legal",
  5: "City Works & Assets",
  6: "City Works & Assets",
  7: "Parks & Environment",
  8: "Recreation & Leisure",
  9: "Recreation & Leisure",
  10: "Local Laws & Compliance",
  11: "Economic Development",
  12: "City Amenity",
  13: "City Works & Assets",
  14: "Parks & Environment",
  15: "Local Laws & Compliance",
  16: "Waste & Recycling",
  17: "Governance & Legal",
  18: "Governance & Legal",
  19: "Local Laws & Compliance",
  20: "Local Laws & Compliance",
};

const parseClauses = (text) =>
  text
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#"))
    .map((line) => {
      const [part, partTitle, clause, title, tags] = line.split("|");
      return {
        id: clause.trim(),
        part: Number(part),
        partTitle: partTitle.trim(),
        title: title.trim(),
        tags: (tags || "").trim().split(",").filter(Boolean),
        owner: PART_OWNER[Number(part)] || "Unassigned",
      };
    });

const clauses = parseClauses(read("data/clauses.psv"));
const clauseText = readJson("data/clause-text.json");
for (const c of clauses) c.text = clauseText[c.id] || "";
const proposals = readJson("data/proposals.json");

// Link each clause to the backlog items that touch it.
const byClause = new Map();
for (const p of proposals)
  for (const c of p.clauses) {
    if (!byClause.has(c)) byClause.set(c, []);
    byClause.get(c).push(p.id);
  }
for (const c of clauses) c.proposals = byClause.get(c.id) || [];

// Where the internal review has already reached a view. Everything else
// is "Not started" and shows as outstanding work on the dashboard.
const TRIAGE = {
  Retain: ["1", "3", "6", "7", "8", "9", "10", "104", "105", "106", "107", "108", "109", "112", "118", "124", "128", "142", "148", "153", "158", "164", "172", "176", "183", "184", "191", "192", "194", "196", "197", "199", "200"],
  Amend: ["11", "12", "16", "115", "122", "123", "125", "126", "127", "129", "133", "135", "136", "137", "143", "144", "145", "159", "163", "165", "166", "173", "174", "195", "198"],
  Rewrite: ["5", "120", "149", "177"],
  Revoke: ["2", "4", "20", "21", "22", "23", "24"],
  "Under review": ["117", "119", "121", "130", "131", "132", "134", "146", "150", "151", "152", "155", "156", "157", "160", "161", "162", "167", "168", "169", "170", "171", "175", "178", "179", "180"],
};
const triage = {};
for (const [disposition, ids] of Object.entries(TRIAGE))
  for (const id of ids) triage[id] = disposition;
for (const c of clauses) c.disposition = triage[c.id] || "Not started";

const data = {
  generated: new Date().toISOString().slice(0, 10),
  clauses,
  proposals,
  program: readJson("data/program.json"),
  pilots: readJson("data/pilots.json"),
  engagement: readJson("data/engagement.json"),
  risks: readJson("data/risks.json"),
  decisions: readJson("data/decisions.json"),
};

const html = read("src/app.html").replace(
  "/*__DATA__*/",
  JSON.stringify(data).replace(/</g, "\\u003c"),
);

mkdirSync(join(root, "dist"), { recursive: true });
writeFileSync(join(root, "dist/control-room.html"), html);

const counts = clauses.reduce((a, c) => ((a[c.disposition] = (a[c.disposition] || 0) + 1), a), {});
console.log(`dist/control-room.html — ${(html.length / 1024).toFixed(0)} KB`);
console.log(`${clauses.length} clauses:`, counts);
