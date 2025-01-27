export interface Position {
  title: string;
  category: string;
  duties: string[];
  meetings: string[];
}

export interface Letter {
  recipientName: string;
  position: string;
  startDate: string;
  endDate: string;
  referenceNumber: string;
  batch: string;
  customDuties?: string[];
}

export interface LetterTemplateProps {
  letter: Letter;
  position: Position;
}

export type Batch = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';