# Local Law Review — control room

A working tool for managing the City of Stonnington review that has to replace
**General Local Law 2018 (No. 1)** before it sunsets on **19 July 2028** (cl. 4 of
the current law — a ten-year life from commencement on 20 July 2018, with no
power to extend).

The published page is a live tool, not a mock-up: dispositions, owners, notes,
gate statuses, pilot and engagement statuses and risk scores all save and are
shared with everyone who opens it.

## What's in it

| Module | What it does |
| --- | --- |
| **Program** | Counts down to the sunset and to G10, the last immovable decision. Phase/gate chart with the two dates that cannot move drawn across it. |
| **Clause register** | All 121 operative clauses of the 2018 law, each with a disposition, an owning business unit and a review note. Gate G3 closes when nothing is left at "Not started". |
| **Proposals** | The change backlog, including items held since 2019. Impact-against-effort matrix, sensitivity rating, and a disposition every item has to receive. |
| **Engagement** | Issues-stage and statutory activities, each with its IAP2 level and the promise that level makes. |
| **Pilots** | Seven pilots, each running under powers Council already has, each with a hypothesis and a stated measure, all reporting by G4. |
| **Risks & decisions** | 5×5 risk matrix with treatments, plus the decision log that stops settled questions being reopened. |

## Repository layout

```
data/clauses.psv       the register of the 2018 law — part, clause, title, type markers
data/proposals.json    the change backlog
data/program.json      phases, gates and the immovable dates
data/pilots.json       pilot register
data/engagement.json   engagement plan
data/risks.json        risk register
data/decisions.json    decision log
src/app.html           the application
build.mjs              inlines data/ into src/app.html
dist/control-room.html the built, publishable page
reference/             the 2018 local law as supplied, plus extracted text
```

Edit the data, then:

```
node build.mjs
```

`build.mjs` also holds two pieces of program content: `PART_OWNER`, the business
unit owning each Part, and `TRIAGE`, the dispositions the internal review has
reached so far. Change those there, not in the built file.

## Where the content comes from

Clause numbers, titles, Part structure, the sunset date, the incorporated
documents and the type markers (permit trigger, notice power, infringeable
offence, superseded reference) are read from the 2018 law itself, including the
numbering gap at Part 4, repealed in 2023.

**Everything else is a starting position to be argued with, not a record.** The
backlog, pilots, engagement plan, dates, risks and decisions are drafted to be
realistic and specific enough to be useful on day one — they are not a record of
what Stonnington has actually decided. Expect the project manager's first
session to be spent overwriting them.

## Statutory steps still to be confirmed

The gates flagged "Confirm with Governance" carry provisional references to the
Local Government Act 2020 and Council's Governance Rules. The program assumes a
conventional cycle — public notice of purpose and general purport, copies
available, a submission period, a hearing for those who ask to be heard, Council
resolution, Gazette publication, a copy to the Minister. Governance and Legal
should confirm the exact notice period, submission process and publication
requirements before G2 is written up. If the notice period differs, the dates in
`data/program.json` need re-cutting.
