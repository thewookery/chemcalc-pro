/**
 * @fileOverview Client-compatible flow to interpret voice commands for calculators.
 */

export interface VoiceCommandInput {
  transcript: string;
  fields: {
    id: string;
    label: string;
  }[];
}

export interface VoiceCommandOutput {
  action: 'update_field' | 'read_result' | 'unknown';
  fieldId?: string;
  value?: string;
  message?: string;
}

const wordToNumberMap: Record<string, string> = {
  zero: '0',
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  nine: '9',
  ten: '10',
  point: '.',
  dot: '.',
};

function normalizeSpokenNumbers(text: string): string {
  let normalized = text.toLowerCase();
  for (const [word, num] of Object.entries(wordToNumberMap)) {
    const reg = new RegExp(`\\b${word}\\b`, 'gi');
    normalized = normalized.replace(reg, num);
  }
  // replace space between digits and decimal point if any
  normalized = normalized.replace(/(\d+)\s*\.\s*(\d+)/g, '$1.$2');
  return normalized;
}

export async function parseVoiceCommand(input: VoiceCommandInput): Promise<VoiceCommandOutput> {
  const { transcript, fields } = input;
  const rawText = transcript.trim().toLowerCase();
  const normalized = normalizeSpokenNumbers(rawText);

  // 1. Check for read result intent
  const readTriggers = ['read result', 'tell me the result', 'what is the result', 'what is the answer', 'read the result', 'result', 'answer'];
  if (readTriggers.some(t => rawText.includes(t))) {
    return {
      action: 'read_result',
      message: 'Reading calculation result',
    };
  }

  // 2. Extract number
  const numberMatch = normalized.match(/-?\d+(?:\.\d+)?/);
  const extractedValue = numberMatch ? numberMatch[0] : null;

  // 3. Match field
  let bestField: { id: string; label: string } | null = null;
  let bestScore = 0;

  for (const field of fields) {
    const cleanLabel = field.label.toLowerCase().replace(/[^a-z0-9 ]/g, ' ');
    const labelWords = cleanLabel.split(/\s+/).filter(w => w.length > 2);
    let score = 0;

    for (const word of labelWords) {
      if (rawText.includes(word)) {
        score += word.length;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestField = field;
    }
  }

  if (bestField && extractedValue) {
    return {
      action: 'update_field',
      fieldId: bestField.id,
      value: extractedValue,
      message: `Set ${bestField.label} to ${extractedValue}`,
    };
  }

  return {
    action: 'unknown',
    message: 'Could not understand voice command',
  };
}
