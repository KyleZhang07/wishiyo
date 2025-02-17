
export const generateFunnyBiographyPrompt = (authorName: string, stories: Array<{question: string, answer: string}>) => {
  const storiesText = stories.map(story => `${story.question}\nAnswer: ${story.answer}`).join('\n\n');
  
  return `As a comedic biography writer, create 3 hilarious book ideas for a funny biography about a person named ${authorName}. Use the following information about them:

${storiesText}

Generate 3 different book ideas. Each should have:
1. A catchy, witty title that includes their name or references their characteristics
2. "by [authorName]" as the author line
3. A funny description that ties together their quirks and stories in an entertaining way

Format each idea like this:
{
  "title": "The witty title",
  "author": "by [authorName]",
  "description": "The funny description"
}

Return exactly 3 ideas in a JSON array.`;
};
