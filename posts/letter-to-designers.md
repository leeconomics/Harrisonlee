---
id: 9
n: "09"
slug: letter-to-designers
type: letter
tag: "Note 09"
title: "A letter to designers: the artifact is becoming the build"
sub: "What is changing in your craft, what is not yet, and how to prepare."
subtitle: "What is changing in your craft, what is not yet, and how to prepare"
cats: [Craft, AI, Marketing]
read: "6 min"
readTime: "6 min read"
date: "2026-04-30"
displayDate: "April 2026"
listDate: "30 April 2026"
---

This is written to designers, and only really for designers. Most of the noise about AI and design lands on either side of a tired axis. AI replaces designers. Or AI slop hollows out the discipline and craft is the moat. Both are arguments about the wrong layer.

The quieter story is the one worth your attention. The frictions that have shaped your craft for a decade are softening. Not all at once, not all yet, but the direction is clear and the rate of change is accelerating. I am writing this the way I would write it to a designer on my own team. Not to convince you of anything urgent. To make sure you see it before everyone else is.

## The frictions that defined the craft

Design has run on a set of frictions that most designers treat as facts of life. They are not facts of life. They are artefacts of a workflow that is starting to break.

The mockup is a lie. Figma is static. Real sites have hover states, loading states, error states, animations, scroll behaviours, breakpoints. You ship one version. Engineering invents twenty more, often guessing wrong. You push back. The loop runs.

Spacing and type drift. You set a heading at 32px. Engineering writes 2rem. The unit is different, the rendering is subtly off, and the built site stops feeling like the design. Multiply that across hundreds of values and the design language goes soft.

The iteration asymmetry. Thirty seconds in Figma. Four hours in code. You iterate freely. Engineering pays the cost. Resentment compounds. Decisions slow.

The handoff. Briefly the celebrated artifact of the discipline. More recently, the thing that has quietly capped how much of your taste actually makes it to the built product.

These are not annoyances. They are the ceiling on your leverage as a designer for a decade. Strip them out and the ceiling moves.

## A compressed history

The last ten years are easy to summarise. Sketch and Zeplin named the handoff. Figma killed Sketch with multiplayer. Webflow and Framer collapsed the entire pipeline for marketing sites. Then AI showed up in the loop. Each step closed a piece of the artifact-to-build gap. The current step is closing most of what is left.

## What no-code actually did

The no-code wave was real but bounded. Webflow, Framer, Squarespace, Bubble. They collapsed the designer-to-developer pipeline for marketing sites, portfolios, simple e-commerce, internal dashboards. They got non-designers to 80% on those categories. Wrote the HTML and CSS for you. Wrapped the canvas.

They never got past 80% on serious product design. The ceiling was not skill-based. It was structural. The artifact lived inside a locked platform. You could edit the canvas, not the code. The moment you wanted something the platform did not anticipate, you fell off the cliff. Most product UI lives on the other side of that cliff.

The no-code chapter ended without taking the parts of the discipline that mattered most. The artifact was never real.

## What is structurally different now

AI does not produce a locked artifact. It produces real code, in your codebase, in your conventions, that you can read, edit, ship, and version. That single shift moves the ceiling.

The moves of the last eighteen months, named without commentary. Figma launched Dev Mode properly. Code Connect maps a Figma component to the actual component in your codebase. Anthropic released MCP. Figma's MCP server lets Claude and Cursor read your Figma file directly. Claude generates working interfaces from a prompt. v0, Bolt, Lovable, Cursor. Each one on its own is a small step. Together they collapse the build step.

<div class="pull-quote">The Figma file is no longer the source of truth. The codebase is.</div>

That is the sentence to sit with.

## The personal proof

I built my own website over a weekend. No design background. No Figma. No Tailwind training. No reference discipline. Wrote a sentence describing what I wanted. Claude generated the structure. I judged it live, prompted in language, iterated. Dropped into the CSS for the last few values. Shipped.

The site is fine. It is not good. The typography is slightly off. The spacing breathes too generously in some places, too tightly in others. The animation timing is not quite right. You can feel the missing taste.

That is the point.

If I can run the loop end to end on entry-level inputs and produce something that exists at all, a designer with taste, a real reference library, and basic CSS can produce something that actually lands. The loop is the same. The inputs are everything.

## The shape of the loop in practice

Spec and references at minute one. Type system, colour palette, spacing scale, three reference sites. Treat it like a brief, not a prompt. This is the single largest force-multiplier in the whole workflow.

Optional: a Figma frame to give the AI a starting base. Useful for product UI where the structural decisions are heavy.

AI generates the structure in real code.

You judge the live output. Iterate in language. "More breathing room around the heading." "Warmer palette." "Less corporate." "Tighter density on the cards."

Optional: Claude or similar for prototyping animation. The thing that used to need a Lottie file or a developer's afternoon is now a conversation about easing curves and durations.

Final five percent in CSS. Exact values. Edge cases. The pieces the model keeps getting wrong.

Pair with a developer for performance, accessibility, and the weird Safari bug. That handoff still exists. It is much smaller and much more interesting than it used to be.

## What is not there yet

I do not want to oversell this. The seams are real.

Real content still breaks layouts. The model does not know your data, your titles, your edge cases.

Animation timing is uneven. The model has opinions about easing and they are often wrong.

Accessibility edge cases still need a manual pass. Contrast on hover, focus indicators, reduced-motion fallbacks. The model improves. It does not yet replace the audit.

Bidirectional sync is messy. Figma to code is largely solved. Code back to Figma, when an engineer changes something, is still an open problem.

Context drift over long threads is real. The model forgets early decisions. Good operators restate the spec periodically or start fresh threads with a tightened brief.

The loop is closing. It is not closed.

## The skill stack that compounds

Four inputs, in order of how much each one bends the curve.

- **Taste.** The largest single input. Years to build. Untrainable in a weekend. The skill of looking at three options and knowing which is better, and being able to say why. [[post-ai|The trait recruiters under-test for]], and the one that splits the leveraged designer from the slop cannon.
- **Reference fluency.** Knowing what good looks like across enough domains to pull a relevant anchor in seconds. Editorial sites, product sites, portfolios, niche aesthetics. Built through daily looking, not weekly.
- **CSS vocabulary.** A weekend. Padding, margin, line-height, letter-spacing, max-width, gap, flex, grid. Just enough to be precise when prompting and to read AI output without flinching.
- **Spec discipline at minute one.** A few projects to learn. The biggest force-multiplier in the loop and the one most designers still skip.

Three and four are weekends. One and two are years.

<div class="pull-quote">The leverage gap between the designer with AI and the non-designer with AI is not the loop. It is everything you bring to it.</div>

That asymmetry is good news for designers. The shift you have been told to fear rewards the inputs you have already been building — the same asymmetry [[speed-taste-tradeoff|playing out in creative right now]].

## How to prepare

Concrete and short.

- Spend a weekend on CSS basics. Not to write it from scratch. To name it precisely when prompting and to read AI output without panic.
- Build a reference library you actually use. Three sites for editorial, three for product, three for personal. Pinned somewhere you open daily.
- Treat the first prompt of any AI design session like a real brief. Type, colour, spacing, references. A tight spec at minute one beats ten prompts of fixing.
- Run one full project without Figma. Even badly. The point is to feel the new loop in your hands.
- Pair with a developer for the last five percent. The handoff that survives is smaller, sharper, and more collaborative than the one you have been complaining about.

## The close

Your craft has been quietly clipped for a decade by the gap between the artifact and the build. That gap is closing. The designers who lean into the loop will be more leveraged, not less.

Treat this as a heads-up, not a warning. The shape is not all there yet. The direction is not in doubt.
