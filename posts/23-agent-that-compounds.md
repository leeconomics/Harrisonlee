---
id: 23
n: "23"
slug: agent-that-compounds
tag: "Note 23"
title: "Six steps to an agent that compounds"
sub: "Onboard your AI agent like a new hire."
subtitle: "A setup manual for AI agents that get sharper with use, not flatter"
cats: [AI, Strategy]
read: "6 min"
readTime: "6 min read"
date: "2026-05-01"
displayDate: "May 2026"
listDate: "1 May 2026"
---

Most people setting up AI agents are underbuilding them and then concluding the agents do not work. They drop a one-liner into a chat, judge the first output, and walk away. The teams getting real leverage are doing something more thorough, and frankly more boring. They are treating agent setup the way they would treat onboarding a new hire. Heavy context, a clear manual, real tools, a feedback loop that actually closes.

The piece below is the manual that describes that process, in the order I would actually do it. It is a knowledge share, not an argument. Use it as a checklist when you are setting up your next agent in Cowork, Claude, or anything else.

### The six steps at a glance

| # | Step | What it produces |
|---|------|------------------|
| 1 | **Map the workflow** | A doc that reads like an intern's manual |
| 2 | **Load the context** | An operator profile, a business profile, a calibration set |
| 3 | **Write guidelines and don'ts** | Positive rules plus banned patterns |
| 4 | **Connect the tools** | Read access, write access, and clear guardrails |
| 5 | **Test and log misses** | A change log of what fell flat and why |
| 6 | **Update the system, not the prompt** | A versioned, living set of instructions |

The order matters. Each step assumes the previous one has been done properly. Skipping ahead is the most common reason setups feel mediocre and stay there.

### Step 1 — Map the workflow

Before any prompting, write down the actual sequence of work the agent needs to do. Think of it as a manual you would hand to a smart intern on day one. What are the stages, where do decisions happen, where does the human stay in the loop, and what does "done" look like at each step. If you cannot describe the workflow clearly to another person, the agent will not infer it from a clever prompt, no matter how cleverly the prompt is written.

The first artefact in any good agent setup is a workflow document, not a prompt. The prompt comes later, and it gets shorter when the workflow is properly mapped, because most of the work has been done in the doc.

> **Checklist for Step 1**
> - [ ] Stages of the work, in order
> - [ ] Inputs and outputs for each stage
> - [ ] Decision points where the agent should pause
> - [ ] Human checkpoints, with format for the handoff
> - [ ] Definition of "done" for the overall workflow

### Step 2 — Load the context

The single biggest predictor of whether an agent's output feels right is the depth of context it has been given. Most setups starve the agent here, usually because the operator is being precious about token usage at the wrong stage. Setup is the one place where more is almost always better.

Three layers of context tend to matter the most. The operator profile, which covers who you are, how you think, what you care about, and how you talk. The business or domain context, which covers what you are working on, the recurring vocabulary, the metrics that matter, the constraints that shape your decisions. And a calibration set, which is a small library of best-in-class examples that show the agent the bar for "good." The calibration set is the one most operators forget. It is also the one that makes the largest single difference.

```
   CONTEXT LAYERS
   ─────────────────────────────────────────
   Operator profile    →  who you are, how you think
   Domain context      →  what you work on, vocabulary, constraints
   Calibration set     →  examples of best-in-class output
```

> **Checklist for Step 2**
> - [ ] Operator profile (background, working style, communication preferences)
> - [ ] Domain or business context (vocabulary, metrics, constraints)
> - [ ] Calibration set (3-6 best-in-class examples of the desired output)
> - [ ] Explicit statement of the bar for "good"

### Step 3 — Write the guidelines and the don'ts

Positive instructions on their own are not enough. Models default to generic patterns when the instruction is broad, and the genericness is exactly what makes outputs feel mediocre. The work happens when you also name the failure modes you want to avoid.

In my experience the don'ts do more work than the dos, especially for anything where voice or judgment matters. Banned phrases, structural patterns that read as slop, common mistakes from earlier outputs. The more specific the don'ts, the more the agent's output starts to feel like yours rather than the model's defaults.

> **Checklist for Step 3**
> - [ ] Positive rules (what good looks like)
> - [ ] Banned phrases and patterns (the AI tells you want to avoid)
> - [ ] Edge cases (when the standard approach does not apply)
> - [ ] Decision rule for when to ask the operator versus when to act

### Step 4 — Connect the tools

An agent that can only talk is a thinking partner, which is useful but limited. An agent that can read your files, write to your storage, pull from your data sources, and push to your downstream tools is an operator. The leverage difference between the two is enormous, and most setups stop at the thinking-partner level because connectors feel fiddly to set up.

They are worth the time. A well-connected agent collapses entire workflows that used to require human-in-the-loop coordination. A poorly connected one stays a chat partner forever.

```
   AGENT CAPABILITY LADDER
   ─────────────────────────────────────────
   Read only          →  thinking partner
   Read + write       →  drafting partner
   Read + write + push →  operator
```

> **Checklist for Step 4**
> - [ ] Read access (what should the agent be able to see)
> - [ ] Write access (what is it allowed to modify or create)
> - [ ] Guardrails (what is off-limits, what requires explicit confirmation)
> - [ ] Confirmation points (where you want a human in the loop before action)

### Step 5 — Test and log the misses

The first few outputs will be wrong in specific, recurring ways. The job is to spot the pattern in the misses rather than fix each one in the chat. Treating each miss as a one-off prompt fix is how setups stay mediocre, because the underlying instruction never improves and the same mistake will resurface in the next run.

Keep a running log of what fell flat and why. The log becomes the source of truth for system updates. Over a few cycles it tells you which file the fix actually belongs in, and which patterns are recurring rather than one-off.

> **Checklist for Step 5**
> - [ ] What failed (specific output, specific run)
> - [ ] Why it failed (the underlying pattern, not just the symptom)
> - [ ] Which file the fix belongs in (workflow doc, context, guidelines)
> - [ ] What to test on the next run to confirm the fix landed

### Step 6 — Update the system, not the prompt

This is the step most operators skip, and the one that decides whether the system compounds or stays flat. If the agent makes the same mistake twice, the fix belongs in the workflow doc, the context file, or the guidelines. It does not belong in a longer prompt the next time you talk to it.

Versioning the underlying system is what turns a useful agent into a sharp one over weeks and months. Treat the setup as a living artefact, not a one-off configuration. Bump the version when changes land. Keep a changelog at the bottom of every file. Never update silently, because silent updates make it impossible to debug regressions later.

> **Checklist for Step 6**
> - [ ] Weekly or post-batch review of the change log
> - [ ] Proposed updates with the reason attached
> - [ ] Version bumped on the relevant file
> - [ ] Changelog entry written

### The compounding effect

Each of these steps is unglamorous on its own. The payoff comes from doing all six and keeping the loop running. An agent that has a properly mapped workflow, deep context, named failure modes, real connectors, a miss log, and a versioned set of instructions gets sharper every week. An agent that has a clever prompt does not.

The setups that compound look more like internal documentation than like prompt engineering. That is the part most people miss. The manual you write before you need it is the one that keeps paying.
