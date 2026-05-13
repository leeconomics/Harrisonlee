---
id: 17
n: "17"
slug: design-engineering-fusing
type: observation
tag: "Note 17"
title: "Code is becoming design. Design is becoming code."
sub: "A spectrum, a timeline, and why future builders won't pick a side."
subtitle: "A spectrum, a timeline, and why future builders won't pick a side"
cats: [Craft, AI]
read: "6 min"
readTime: "6 min read"
date: "2026-05-01"
displayDate: "May 2026"
listDate: "1 May 2026"
---

<div class="memo-hero">
  <img src="/posts/design-engineering-fusing.svg" alt="Code is becoming design. Design is becoming code" loading="eager" />
</div>

To the average person, design and engineering look like opposite crafts. One is visual, intuitive, taste-led. The other is technical, structured, logic-led. This view is correct about how the two fields were taught and hired ten years ago. It is increasingly wrong about how the work is being done now.

The barriers between the two are dissolving from both directions. Engineers are using AI to ship interfaces without designer hand-offs. Designers are using AI tooling to ship working code without engineer hand-offs. ([[letter-to-designers|The letter version of this argument]], aimed at designers specifically, runs in more detail.) The middle ground that used to need two people and a Figma file is increasingly held by one person, with a model doing the seam.

### The spectrum

The two crafts sit on a spectrum, not in separate boxes. Design at one end. Engineering at the other. The middle is the part of the work where the two have always met — the part where someone has to translate intent into something that runs.

```
DESIGN ←──────────────────────────────────────→ ENGINEERING

  Pure visual                                          Pure systems
  Brand, identity                                      Infra, architecture
  Static mocks                                         Backend, APIs
  Typography, taste                                    Performance, scale
  Figma, illustration                                  Servers, databases

                          ↑ the middle ↑
                  prototyping, UI build, interaction,
                  design systems, front-end behaviour
              (this is where the fusion is happening fastest)
```

The interesting work has always sat in the middle. Building the actual interface. Wiring up the interaction. Making the design hold together when it meets real data. The middle is where the two crafts have always overlapped, and it is where AI is now lowering the cost of holding both at once. (This is the design-engineering slice of [[triad-collapsing|a bigger triad collapse]] — PM goes the same way.)

### The timeline

The fusion is recent and accelerating. A rough shape of how the middle has been collapsing:

```
2022 ──── 2023 ──── 2024 ──── 2025 ──── 2026 ──── 2028 (likely)

  ↑         ↑         ↑         ↑         ↑          ↑
  │         │         │         │         │          │
GitHub    ChatGPT     Cursor    v0,     design-     the boundary
Copilot   shifts      makes    Replit   to-code     dissolves
ships     "I can      AI       Agent,   agents      for new
to        write       editing  Figma    standard    builders;
engineers code"       a daily  Make     in IDE;     specialist
          mainstream  habit    early    frontier    titles look
                      for      versions models      vintage
                      builders  ship    can hold
                                        a full
                                        design
                                        system
```

The pattern: each step makes it cheaper for one craft to operate in the territory of the other. Engineers got copilots first. Designers got generative tools next. Then the tools that turn descriptions into running code reached enough fidelity that a designer could ship without an engineer in the loop, and an engineer could ship a credible interface without a designer in the loop. The fusion is not a single product. It is a series of bridges getting cheaper to cross until people stop noticing they are crossing them.

### What is real and what is hype

There are still real differences between the two crafts. Designers hold visual taste at a higher resolution than most engineers. Engineers hold systems thinking and architectural rigour at a higher resolution than most designers. These differences are real and worth preserving. The fusion isn't about erasing them. It is about lowering the cost of one person holding both, which used to be prohibitive.

What is shifting is the *cost*, not the underlying difference in talent. A great designer who can now ship code is still a designer. They are just no longer dependent on a hand-off to test their work in the real world. A great engineer who can now design a credible interface is still an engineer. They are just no longer blocked by needing a designer in the loop for every iteration.

> The fusion is not about erasing the difference. It is about lowering the cost of holding both.

### The exposed archetype

The exposed archetype is the practitioner who treats their discipline as a moat. The designer who refuses to learn how things ship. The engineer who treats UI as someone else's problem. Both were defended by the cost of crossing over, and that cost is dropping faster than most of them realise. The moat was always borrowed time. It is now actively eroding.

**The interesting people to watch are the ones at the boundary.** The engineer who ships their own UI and ships it well. The designer who deploys their own code and writes systems that hold together. They don't have a job title that fits. The fact that they don't is a leading indicator that the categories are wrong.

### What the next few years probably look like

A rough forecast, held loosely:

- **2026–2027.** Design-to-code agents become standard inside design tools. Engineers ship more of the interface work. Specialist hand-offs move up the stack — designers focus on systems and brand, engineers focus on architecture and behaviour, and the middle gets absorbed by tooling.
- **2027–2028.** The new builder profile starts to dominate at early-stage companies. People who build full products solo or in pairs, holding both sides of the spectrum, with AI as the second team. Job titles lag the work.
- **2028+.** New entrants stop training as one or the other. Bootcamps and university programs begin merging the curricula. The specialist tracks remain at the frontier ends of the spectrum — pure brand on one side, pure systems on the other — and the middle of both fields converges.

This timeline will be wrong in detail and right in shape. The direction is set.

### The implication

For builders, hirers, and people early in their careers: stop treating these as separate tracks. Future builders won't be delineated by them. The teams that compound the fastest are the ones with the most people who can hold both at once, and the cost of becoming one of those people has never been lower.

The categories will eventually catch up. The job titles will follow. But the work is already changing, and the people doing the work already know it. The language will get there in three years. The trend is here now.
