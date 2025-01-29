import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

interface Note {
  content: string;
  transcription?: string | null;
  type?: 'text' | 'recording';
}

export async function synthesizeIdea(notes: Note[]) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const combinedContent = notes
    .map(note => {
      const content = note.content;
      const transcription = note.transcription;
      const type = note.type;
      return `${type?.toUpperCase() || 'NOTE'}: ${content}${transcription ? `\nTranscription: ${transcription}` : ''}`;
    })
    .join('\n\n');

  const prompt = `Please analyze and synthesize the following notes and recordings into a comprehensive summary. The output should be structured as follows:

1. Executive Summary (2-3 sentences overview)
2. Key Insights (bullet points of main ideas)
3. Detailed Analysis
   - Relationships between different notes
   - Patterns and themes
   - Important details
4. Action Items (specific, actionable next steps)
5. Questions for Further Exploration

Here are the notes to analyze:

${combinedContent}

Please structure the output in markdown format with clear headings and sections.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

export async function transcribeAudio(audioUrl: string): Promise<string> {
  // This is a placeholder for audio transcription functionality
  // In a real implementation, this would integrate with a transcription service
  return "Audio transcription placeholder";
}