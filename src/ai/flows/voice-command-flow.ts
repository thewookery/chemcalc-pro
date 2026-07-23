'use server';
/**
 * @fileOverview A Genkit flow to interpret voice commands for calculators.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VoiceCommandInputSchema = z.object({
  transcript: z.string().describe('The raw text transcript from the speech recognition.'),
  fields: z.array(z.object({
    id: z.string(),
    label: z.string(),
  })).describe('The list of available input fields for the current calculator.'),
});
export type VoiceCommandInput = z.infer<typeof VoiceCommandInputSchema>;

const VoiceCommandOutputSchema = z.object({
  action: z.enum(['update_field', 'read_result', 'unknown']),
  fieldId: z.string().optional().describe('The ID of the field to update.'),
  value: z.string().optional().describe('The numeric value extracted from the speech.'),
  message: z.string().optional().describe('A friendly response message.'),
});
export type VoiceCommandOutput = z.infer<typeof VoiceCommandOutputSchema>;

export async function parseVoiceCommand(input: VoiceCommandInput): Promise<VoiceCommandOutput> {
  return voiceCommandFlow(input);
}

const systemPrompt = `You are a Voice Assistant for a chemical laboratory calculator app.
Your job is to parse user speech transcripts and determine if they want to update a specific input field or read the final calculation result.

Available Fields for this calculator:
{{#each fields}}
- ID: "{{id}}", Label: "{{label}}"
{{/each}}

Rules:
1. If the user mentions a value and a field name (or something close to it), return action: "update_field".
2. If the user asks to "read the result", "tell me the answer", or "what is the value", return action: "read_result".
3. Extract numeric values accurately (e.g., "one point five" becomes "1.5").
4. If you are unsure, return action: "unknown".
5. Be concise and return valid JSON.`;

const voicePrompt = ai.definePrompt({
  name: 'voiceCommandPrompt',
  input: {schema: VoiceCommandInputSchema},
  output: {schema: VoiceCommandOutputSchema},
  system: systemPrompt,
  prompt: `User Transcript: "{{transcript}}"`,
  config: { temperature: 0.1 }
});

const voiceCommandFlow = ai.defineFlow(
  {
    name: 'voiceCommandFlow',
    inputSchema: VoiceCommandInputSchema,
    outputSchema: VoiceCommandOutputSchema,
  },
  async (input) => {
    const {output} = await voicePrompt(input);
    return output!;
  }
);
