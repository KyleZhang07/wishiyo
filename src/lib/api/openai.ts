
const generateIdeas = async (prompt: string) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a creative writer specializing in humorous biographies.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate ideas');
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
};

export const generateFunnyBiographyIdeas = async (authorName: string, stories: Array<{question: string, answer: string}>) => {
  const prompt = generateFunnyBiographyPrompt(authorName, stories);
  return await generateIdeas(prompt);
};
