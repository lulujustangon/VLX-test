---
name: eli5
description: Explain a topic, codebase, model, paper or error the way eli5.cc does — one sourced learning page with four reading depths (ELI5, Beginner, Detailed, Expert) built on the same source trail, inline numbered citations, a source-agreement signal, one visual map and related questions. Use when the user types /eli5 <topic>, says "ELI5", "explain like I'm 5", "explain it simply", "dumb it down", or asks for an explainer a beginner can start and an expert can finish.
---

# eli5

Build one page a curious reader can enter at the simplest level and leave at expert level, where every claim can be traced to a source. Write in the user's language.

Topic: $ARGUMENTS

## 1. Collect the source trail before writing

- Gather 4–10 sources. Primary material first: the code and README of the repository, the paper, the official docs or blog, a model card or config file. Then secondary explainers.
- For code, read the files that implement the mechanism, not only the README. For a model, read its config if one is published; defaults in code can differ from what was released.
- Give each source one label: **strong** (primary, or independent sources agree), **additional** (useful context), **supporting** (video, forum post, third-party write-up).
- Write down the exact names, identifiers, numbers and commands you will use. Keep them verbatim at every depth.
- Note what you could not check. Never fill a gap with a guess written as fact; say it is unknown or an estimate.

## 2. Find the one idea

- Write the one-sentence version first: what it is and why it exists. Every depth must agree with this sentence.
- Pick one everyday analogy that maps onto the mechanism (a kitchen, a post office, a playground, a shop). Use it only if it explains how the thing works, and say where it stops being true.

## 3. Write four depths on the same trail

Ask the same questions at every depth where possible. Only vocabulary and detail change.

| Depth | Reader | Rules |
| --- | --- | --- |
| ELI5 | Knows nothing | 3–5 short sections, each a question. Three sentences or fewer per section. No jargon. One analogy. |
| Beginner | Curious, no background | Adds how it works. Defines each term the first time it appears. |
| Detailed | Wants the real terms | Names the parts, shows the steps in order, uses worked examples with real numbers. |
| Expert | Practitioner | Precise and short: exact names, identifiers, settings, numbers, trade-offs and limits. |

- Headings are questions the reader would ask.
- Put a numbered citation `[n]` after each factual claim. It links to entry `n` of the source trail. Never cite a source the trail does not list.
- Start with the what, then the analogy, then the detail, then why it matters to the reader.
- Never talk down. Avoid minimizers such as "just", "simply", "obviously", "of course".
- At Detailed and Expert, add a short "what to be careful about" section: separate what the sources show from interpretation, and list limits.
- Mark invented or illustrative examples as examples.

## 4. One visual map

- One large picture that answers the page's main question. At ELI5 level its labels use the reader's words.
- If the user names a drawing skill (for example `/anatomy`), build the visual with that skill and follow its rules. Otherwise use inline SVG.
- Every number on the visual comes from the trail.

## 5. The page

One self-contained HTML page, in this order:

1. Topic, category and a source-agreement chip (strong / mixed / thin, judged from the trail), with the source count.
2. The one-sentence summary.
3. The visual map.
4. A depth switcher with ELI5 selected by default. All four depths are in the page; switching does not reload or drop citations.
5. The source trail: numbered entries with title, site and label. Citations jump here.
6. "Keep exploring": 3–6 related questions.
7. A takeaway sentence a child could repeat.

Make it work in light and dark themes and at phone width. If the host has an artifact or page publishing tool, publish with it and follow its design guidance; otherwise write one `.html` file and give its path.

## 6. Check before handing it over

- All four depths answer the main question the same way.
- Every `[n]` resolves to a trail entry, and every number matches its source.
- Render the page once at desktop and phone width, switch through each depth, and check the console for errors.
