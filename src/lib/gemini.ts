import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function synthesizeIdea(notes: { content: string; transcription?: string | null }[]) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const combinedContent = notes
    .map(note => note.content + (note.transcription ? `\nTranscription: ${note.transcription}` : ''))
    .join('\n\n');

  const prompt = `Please synthesize and organize the following notes and recordings into a coherent and meaningful summary:

${combinedContent}

Please structure the output in a clear, organized manner with sections and bullet points where appropriate.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}