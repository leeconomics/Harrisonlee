---
id: 22
n: "22"
slug: anyone-can-ship
type: opinion
tag: "Note 22"
title: "Anyone can ship a website. Almost no one ships a good one."
sub: "AI democratised the design loop. It did not democratise the inputs."
subtitle: "AI democratised the design loop. It did not democratise the inputs."
cats: [AI, Strategy, Careers]
read: "5 min"
readTime: "5 min read"
date: "2026-05-01"
displayDate: "May 2026"
listDate: "1 May 2026"
---

The Claude-style design loop is now available to anyone with a browser. Describe what you want. AI generates working code. See it live. Describe what to change. It iterates. The loop that used to require a designer, a developer, a Figma file, and a week of back-and-forth now runs in your evening, by yourself, for free.

This is the part everyone has noticed. The part almost no one has noticed is what it means. The capability floor moved to the basement. The quality ceiling did not. The interesting question is not what got easier. It is what got harder.

### The loop is the same for everyone

The mechanic is identical regardless of skill. Spec, generate, judge, refine, ship. A senior designer at Stripe runs this loop. A first-time founder running their personal site runs this loop. The model in the middle is the same. The IDE is the same. The output type is the same — real code that you can edit, deploy, and own.

What is different is what each person brings to the prompt and what each person notices about the output. The designer arrives with three reference sites pinned, a typographic system already in mind, and a vocabulary for what to push back on when the model defaults to safe-and-generic. The first-time founder arrives with "make me a personal site" and gets a personal site that is fine.

Both shipped. Only one shipped something memorable. The loop did not produce the gap. The inputs did. ([[letter-to-designers|The designer-specific version of this argument]] runs the same shape on a different audience.)

### The four inputs that are not democratised

Four things sit upstream of the prompt and decide how much of the loop's leverage you actually capture.

The first is taste. The skill of looking at three options and knowing which is better, and being able to articulate why. AI reverts to the mean. Reverting to the mean is what averages do. Calling it back to a sharper place requires someone who can see the better version and name the gap. Taste is years of looking at a lot of work, holding strong opinions about it, and being wrong publicly enough to recalibrate. There is no weekend version of this.

The second is reference fluency. Knowing what good looks like across enough categories to pull a relevant reference fast. Editorial layouts for memos. Product sites for SaaS. Portfolios for personal. Pasting three sites into Claude and saying "this typography, this density, this restraint" gives the model something to anchor on. Pure-text prompts default to bland. Most people skip the references because they do not have a library to pull from.

The third is spec discipline at minute one. The single biggest force-multiplier in the loop. A tight first prompt — type, palette, spacing scale, references, and the one thing the site is for — makes every subsequent prompt five times more effective. Most people treat the first prompt as throwaway and get throwaway results. The good designer-operator writes a real spec before they generate anything.

The fourth is just enough code vocabulary to be precise. Padding, line-height, max-width, gap. Not because you need to write it. Because being able to say "tighten body line-height to 1.6, push max-width to 720px" is faster than gesturing at vibes. A weekend gets you here. Most people do not spend the weekend.

> The AI compresses execution. It does not compress judgment. The judgment work moved to the front and to the back. Both require taste.

### The exposed archetype

The exposed archetype is the operator who saw the loop become free, concluded that design has been democratised, and started shipping. The output is fine. Everything is fine. Nothing is bad. Nothing is memorable either. The Webflow-template feel that used to come from a $19 template now comes from a free model, and the result is the same: indistinguishable from a thousand other sites built the same way, by people who brought the same nothing to the prompt.

This is not an argument that AI design tooling is bad. It is the argument that the tooling is now adequate, which means the variance in output is no longer about the tooling. ([[wrong-direction-faster|AI doesn't fix bad design]] — it scales it, faster than the operator can correct course.) The variance is about the operator. Five years ago, the constraint on shipping was that you could not get the loop to run. Now the constraint is whether you can run it well. Different problem. Same gap, just relocated.

### Personal evidence

I shipped this site in a day with Claude. No design background. No Tailwind fluency before this week. No reference library worth the name. The loop ran. The site is fine.

A second version, after a weekend of staring at editorial sites and a weekend of CSS basics, would land in a different category. Not because I would have become a designer. Because the prompter would have gotten better. The model is the same model. The leverage is in the inputs, not the loop.

That is the experience of running the new loop on entry-level inputs. It works. It is also visibly not great. The gap between fine and great is the gap between the inputs I had and the inputs I did not.

### The implication

The interesting question for the next decade is not whether AI replaces designers. It is what the new design hire is shaped like. Three years ago you hired Figma fluency, taste, and patience for handoffs. Now you hire taste, reference fluency, spec discipline, and basic code reading. The middle role — Figma jockey who hands off to a developer — is gone, the same way the mid-tier IC manager is gone. Both were translation layers in a system the model now translates inside of.

The democratised loop is real and worth using. It is also exposing a market that does not get talked about much yet — the gap between operators who run the same loop and produce wildly different outputs. The tools are not the moat. The taste is. The references are. The spec is. The model is doing the build. The work that used to be the build moved upstream and downstream, and both ends are still loaded with the things that take years to develop.

**Anyone can ship a website now. Almost no one can ship a good one.** The interesting question is which of those two operators you are about to become.
