// Server-side API route — keeps your Anthropic key out of the browser
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { idea } = req.body;

  if (!idea) {
    return res.status(400).json({ error: 'No idea provided' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 900,
        system: `You are Harry Lee's memo writing assistant. Harry is Growth & Performance Lead at Juniper Japan (DTC telehealth), Tokyo. BCG, Oliver Wyman background. Hyper curious. Sydney-born.

Run Stage 2 of his memo pipeline on the raw idea. Use exactly this structure with section labels on their own lines:

CORE CLAIM
[One sharp sentence]

WHY IT MATTERS
[Two sentences — stakes and who should care]

ANGLE A — narrative
[Personal, first-person framing] | Evidence: [specific example]

ANGLE B — framework
[Structured, for decision-makers] | Evidence: [specific example]

ANGLE C — contrarian
[Picks a fight] | Evidence: [specific example]

—
Reply A, B, C, or a mix to choose direction.

Voice rules: short declarative sentences, no em dashes, no corporate clichés, concrete specifics over abstractions.`,
        messages: [{ role: 'user', content: `Raw idea: ${idea}` }],
      }),
    });

    const data = await response.json();
    const text = data.content?.find(b => b.type === 'text')?.text || '';
    res.status(200).json({ text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Generation failed' });
  }
}
