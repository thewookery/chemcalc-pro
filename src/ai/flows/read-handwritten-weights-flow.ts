'use server';
/**
 * @fileOverview A Genkit flow to read handwritten waste and stripping weights from an image.
 *
 * - readHandwrittenWeights - A function that processes an image to extract weights.
 * - ReadHandwrittenWeightsInput - The input type for the function.
 * - ReadHandwrittenWeightsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ReadHandwrittenWeightsInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo of a document with handwritten weights, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ReadHandwrittenWeightsInput = z.infer<typeof ReadHandwrittenWeightsInputSchema>;

const ReadHandwrittenWeightsOutputSchema = z.object({
  wasteWeight: z.number().nullable().describe('The recognized handwritten weight for waste. Null if not found or unreadable.'),
  strippingWeight: z.number().nullable().describe('The recognized handwritten weight for stripping. Null if not found or unreadable.'),
  errorMessage: z.string().optional().describe('Any error message if processing failed or weights could not be reliably extracted.'),
});
export type ReadHandwrittenWeightsOutput = z.infer<typeof ReadHandwrittenWeightsOutputSchema>;

export async function readHandwrittenWeights(input: ReadHandwrittenWeightsInput): Promise<ReadHandwrittenWeightsOutput> {
  return readHandwrittenWeightsFlow(input);
}

const systemPrompt = `You are an Optical Character Recognition (OCR) expert specialized in reading handwritten numbers from industrial documents like batch tickets or weight slips.

Task:
Analyze the provided image and extract two specific handwritten numerical values: 'Waste Weight' and 'Stripping Weight'.

Context Clues:
- 'Waste Weight' might be labeled as "Waste", "W", "Scrap", "Loss", "Wst", or "W-wt".
- 'Stripping Weight' might be labeled as "Stripping", "S", "Str", "Strip", or "S-wt".
- Numbers are typically written in ink or pencil near these labels.

Extraction Rules:
1. Return ONLY numerical values. Ignore units (lbs, kg, etc.).
2. If a value is clearly present and legible, return it as a number.
3. If a value is missing, illegible, or crossed out, return null for that field. 
4. DO NOT guess. If you are not high-confidence in the digit, return null.
5. If the image is too blurry, too dark, or doesn't contain numerical weights, set the 'errorMessage' field.
6. Your output must be a valid JSON object.
`;

const ocrPrompt = ai.definePrompt({
  name: 'readHandwrittenWeightsPrompt',
  input: {schema: ReadHandwrittenWeightsInputSchema},
  output: {schema: ReadHandwrittenWeightsOutputSchema},
  system: systemPrompt,
  prompt: `Carefully examine this document image for handwritten 'Waste Weight' and 'Stripping Weight'.

Image:
{{media url=imageDataUri}}

Identify the numbers associated with waste and stripping. Return null for any values that are unreadable.`,
  config: {
    temperature: 0.0, 
  }
});

const readHandwrittenWeightsFlow = ai.defineFlow(
  {
    name: 'readHandwrittenWeightsFlow',
    inputSchema: ReadHandwrittenWeightsInputSchema,
    outputSchema: ReadHandwrittenWeightsOutputSchema,
  },
  async (input: ReadHandwrittenWeightsInput) => {
    try {
      const {output} = await ocrPrompt(input);
      
      if (!output) {
        return {
          wasteWeight: null,
          strippingWeight: null,
          errorMessage: 'The AI model could not process the request.',
        };
      }
      
      const wasteWeight = typeof output.wasteWeight === 'number' && !isNaN(output.wasteWeight) ? output.wasteWeight : null;
      const strippingWeight = typeof output.strippingWeight === 'number' && !isNaN(output.strippingWeight) ? output.strippingWeight : null;
      let errorMessage = output.errorMessage;

      if (wasteWeight === null && strippingWeight === null && !errorMessage) {
         errorMessage = 'No Waste or Stripping weights were identified in the image.';
      }

      return {
        wasteWeight,
        strippingWeight,
        errorMessage,
      };
    } catch (e: any) {
      return {
        wasteWeight: null,
        strippingWeight: null,
        errorMessage: 'An error occurred during image analysis. Please try again with a clearer photo.',
      };
    }
  }
);
