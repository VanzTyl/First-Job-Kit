# Tailor — interface mockup

**Deliverable B of 2.** This is the screen specification for a resume-to-tailored-resume
pipeline. It is deliberately **not connected** to the notebook in `../notebook/`. That notebook is
the logic; this page is the interface. They share no code, no data file, and no parser.

**All content is SYNTHETIC.** The resume belongs to "Sample Candidate A", every employer name ends in
"(synthetic)", the email is `candidate@example.com`, and the phone number is placeholders. No real
person, resume, employer, or posting is represented anywhere in this folder.

Prepared by Christian Leonard De Guzman · Romm James Cuya · James Marius Panado · Samuel Eisyss Odoño.

---

## 1. How to open it

Double-click `index.html`. That is the whole installation.

- No server, no build step, no package manager, no CDN, no ES modules.
- `data/sample-data.js` and `app.js` are classic `<script>` tags, which is why `file://` works.
- Nothing is fetched, uploaded, or saved anywhere. The only network-free side effect is the
  download button, which writes a file to your own device through a Blob URL.

Tested in the browser that was available at build time: none was installed on the build machine.
The page is written to the platform floor (classic scripts, `var`, no optional chaining in the
hot path) but **the click-through in §5 has not been performed in a real browser** — see
`../HANDOFF.md` §5. Whoever opens it first should read §5 and correct it.

## 2. What to click, in order

The stepper at the top (01–08) and the in-page buttons both work. A five-minute walkthrough:

| Step | Do this | What to look at |
|---|---|---|
| 01 | Press **Use the synthetic sample resume** | Stage text changes four times. No percentage is shown, because the duration is not known. **Cancel parsing** mid-way and read the cancelled panel. |
| 01 | Drop or choose a `.pdf` or `.docx` | The error names the format and the fix, inline. It does not pretend to have read it. |
| 02 | Open **Why this confidence, and edit it** on any card | The reasons add up to the number. Delete a section, restore it, rename one, merge two, split one at a line. |
| 02 | Look at **Certifications** | Deliberately empty. It is flagged, offers to add a line or continue without it, and never fills itself in. |
| 03 | Remove **Figma**, then add it back by hand | Your addition is labelled *added by you*. It is never counted as something the system found. |
| 04 | Set the filter to **Nine or more shared terms**, then to **Has a must-have gap** | Cards open into the exact shared and missing terms. A filter that matches nothing shows a named way out, not a blank list. |
| 05 | Open **Backend Developer** and try to continue without deciding the gaps | It refuses, says how many gaps are undecided, and puts focus on the first one. |
| 06 | **Generate proposals**, then read all four cards | C04 is the planted one: it deletes the word "(basic)" from your own TypeScript description. The panel says why the check cannot catch it. |
| 06 | Reject C03, accept C01 and C02, edit C02's wording | The counter tracks what is still unreviewed. Your edited text is marked as yours. |
| 07 | Read the compare view, then **Download the tailored resume (.md)** | The file is written locally. The status strip says so and says nothing was sent anywhere. |
| 07 | Press **Undo the last decision**, then **Start over** | Undo restores the previous decision, not the previous text. Start over resets to screen 01. |

## 3. Every state, on purpose

The panel at the bottom right forces a state onto any screen. It is a demo control, labelled as
such, and it is not part of the product.

| State | What the forced state shows | Why it is a separate state |
|---|---|---|
| **idle** | The screen before anyone acts, with nothing implied | Proves the page does not look "in progress" by default |
| **focused** | A real focus ring on the screen's primary control | The ring is produced by focusing, so it is the actual style, not a picture of it |
| **pressed** | The pressed appearance, held for 1.4 s | Shows the control acknowledges the press before the outcome |
| **processing** | Indeterminate bar, named stage, and a Cancel button | Proves the page never invents a completion percentage |
| **success** | An outcome stated in words **and** an icon | Proves colour is not the only carrier of meaning |
| **failed** | What happened, what is preserved, the next action | Proves failure is not an apology with no exit |
| **cancelled** | That stopping was allowed, and what the stop did | Proves Cancel is real and has a stated consequence |

Screens 01, 06 and 07 have dedicated panels for these states. The other five fall back to a generic
panel with the same four questions answered, because they have no real failure of their own to show.

## 4. HCI decision map

One row per decision that a reviewer might otherwise think was taste. The **course term** column uses
the vocabulary from the module decks; the **mechanism** column says what the screen actually does.

| Decision | What a person sees | Course term | Mechanism, stated plainly |
|---|---|---|---|
| Formats and the 2 MB cap are printed **before** the file picker | A sentence, not an error | Error prevention; clear requirements | The limit cannot be discovered by failing. Rules arrive before the action. |
| A bad file produces a named problem **and** a named fix | "`.pages`, which this page cannot read" / "Save or export it as .md" | Help users recognise, diagnose, and recover from errors | The message contains the cause and the next step, in the same block, next to the control. |
| Parsing shows stage text and no percentage | "Detecting sections…" with a Cancel button | Visibility of system status; honest progress | Duration is unknown, so the bar is indeterminate. §6.14 of the deck: stop the loading state when the outcome is known. |
| Confidence is a number **with its arithmetic attached** | "+0.30 heading, +0.12 shape, +0.05 shape, +0.10 content" | Feedback; explainability *(extension)* | The reasons shown sum to the number shown, so the number can be argued with. This was a defect found and fixed during the build: the first version displayed reasons that did not add up. |
| An empty section is capped at 45% and flagged | An icon, the word "Check this", and a panel | Low-confidence signalling without colour alone | A heading with nothing under it cannot look confident, whatever its shape signals said. |
| An unrecognised heading is kept, not guessed | The Unclassified card, with the reason it is unclassified | Recognition rather than recall; error prevention | Guessing a section is the same mistake as guessing content. The text stays visible and is excluded from matching. |
| Terms are removable, and additions are labelled | *(added by you)* next to the term | User control and freedom; natural language | The person can correct the system, and the correction is attributed to them, not to the system. |
| A term the system never found is not invented into the list | "Python — not present" sits in its group, unstyled as evidence | Match between system and real world | Absence is shown as absence. It is not turned into a row of zeroes that looks like data. |
| Match cards expand into the **shared and missing** terms | Two lists, ticked and unticked | Feedback; transparency *(extension)* | The score is a share of the listing's vocabulary, so the arithmetic is inspectable rather than asserted. |
| The score is labelled as fixed sample output | A note on screen 04 | Honesty of status | Editing terms does not re-rank anything here, and the page says so instead of implying a live ranker. |
| Gaps carry a decision the person makes | Three radio choices: leave out / add later / dismiss | User control and freedom; human-in-the-loop *(extension)* | The system has no option that writes experience the person does not have. |
| Continuing is blocked while a gap is undecided | Focus moves to the first undecided gap | Error prevention; forcing function | A decision that matters cannot be skipped by pressing the bright button. |
| Proposals are cards with before, after, reason, and source | One card per change, source lines named | Recognition rather than recall; provenance *(extension)* | Nothing is applied silently. Every change carries the line it came from. |
| C04 is visibly outside the permitted kinds | A warning panel that names `drop_qualifier` | Designed failure; honest limits | The page shows a change its own check cannot catch, and says so, rather than implying the check is complete. |
| The compare view marks unchanged / changed / rejected | Three tags, each with a word | Visibility of system status | The state of every section is readable without opening the ledger. |
| An accepted change that could not be applied is reported | A line in the Proposed column and a comment in the export | Honest status | If the section was edited after the proposal, the page says the change is missing instead of showing a quietly unchanged column. |
| Export says what kind of action it was | "Downloaded to your device. Nothing was sent anywhere." | Feedback; honesty | Downloading a file and submitting an application are different acts, and the copy keeps them apart. |
| Status is always icon + word | ✓ / ! / ■ with text beside each | Accessibility; colour is not the only cue | Every status survives a grayscale pass, because the word carries the meaning. |
| Focus is visible and 3 px with a white halo | A ring that survives a coloured button | Accessibility; keyboard operation | The halo exists so the ring is not lost against the accent fill. |
| Motion stops under `prefers-reduced-motion` | The indeterminate bar becomes a static stripe | Motion accessibility | The meaning (still working, duration unknown) survives with no animation at all. |

**Extensions, labelled as such:** *explainability*, *provenance*, and *human-in-the-loop* are not
terms from the module decks. They are named here because the decisions they describe need a name,
and every use above is marked *(extension)*. Everything else in the table uses the course's own
vocabulary: error prevention, recognition rather than recall, visibility of system status, user
control and freedom, match between system and real world, accessibility.

## 5. What is real here, and what is not

| Real interaction in this browser | Fixed sample output |
|---|---|
| Reading a `.md` or `.txt` you choose, including the 40-character minimum | The six listings, their scores, and their matched/missing term lists |
| The heading scan on screen 02 (its own scanner, simpler than the notebook's) | The four proposals on screen 06 |
| Rename, merge, split, discard, restore | The two "must-have gap" flags, which follow the fixed requirement data |
| Removing and adding terms | The claim that the listing's terms are complete |
| Accept, reject, edit, undo, start over | — |
| The compare view and the ledger table | — |
| The `.md` and `.csv` downloads | — |

Three claims this page deliberately does not make:

1. **It does not claim to have measured a person.** No usability session, no timing, no satisfaction
   score, no participant. A prototype with no test in it should not read like one with a test in it.
2. **It does not claim the pipeline logic works.** That is the notebook's job, and the notebook's
   `07_verify` is the only thing in this project entitled to say a change is traceable to a source.
3. **It does not claim accessibility compliance.** Contrast was measured from the tokens and is
   recorded in `../G1_G3_checks.md`. Keyboard order, screen-reader behaviour, and reduced-motion
   behaviour are designed for but were not verified in a browser on the build machine.

## 6. Files

| File | What it is |
|---|---|
| `index.html` | Eight screens, stepper, dev panel, skip link, live region |
| `styles.css` | Tokens, layout, focus ring, reduced-motion block, forced-colors block |
| `app.js` | Upload, heading scan, term editing, gap decisions, change review, compare, export, forced states |
| `data/sample-data.js` | One synthetic resume, six synthetic listings, keyword groups, four changes (C04 planted) |

The `styles.css` header lists nine measured contrast pairs. The full table of 25 is in
`../G1_G3_checks.md`.
