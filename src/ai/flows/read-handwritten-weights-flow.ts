
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

const systemPrompt = `You are an Optical Character Recognition (OCR) expert specialized in reading handwritten numbers from images of weight slips or documents.
Your task is to analyze the provided image and identify two specific handwritten numerical values: 'Waste Weight' and 'Stripping Weight'.

Look for labels or context that indicate these values. The numbers might be written near terms like "Waste", "W", "Stripping", "S", "Scrap", "Loss", etc.
If you find a numerical value for 'Waste Weight', extract it.
If you find a numerical value for 'Stripping Weight', extract it.

Important Instructions:
1.  Only return numerical values. Do not include units (e.g., lbs, kg).
2.  If a value is clearly present and readable, return it as a number.
3.  If a value is not found, illegible, ambiguous, or you are not confident in its accuracy, return null for that specific field. Do not guess or invent numbers.
4.  If there are any general issues processing the image or extracting data that prevent you from confidently providing weights, set the 'errorMessage' field with a brief explanation. Otherwise, omit 'errorMessage'.
5.  Your output MUST be a valid JSON object adhering to the specified schema.
`;

const ocrPrompt = ai.definePrompt({
  name: 'readHandwrittenWeightsPrompt',
  input: {schema: ReadHandwrittenWeightsInputSchema},
  output: {schema: ReadHandwrittenWeightsOutputSchema},
  system: systemPrompt,
  prompt: `Analyze this image to find handwritten 'Waste Weight' and 'Stripping Weight'.

Image:
{{media url=imageDataUri}}

Return the results in the specified JSON format. Remember to return null for any weight you cannot confidently identify.`,
  config: {
    temperature: 0.1, 
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
          errorMessage: 'No output from OCR model.',
        };
      }
      
      const wasteWeight = typeof output.wasteWeight === 'number' && !isNaN(output.wasteWeight) ? output.wasteWeight : null;
      const strippingWeight = typeof output.strippingWeight === 'number' && !isNaN(output.strippingWeight) ? output.strippingWeight : null;
      let errorMessage = output.errorMessage;

      if (wasteWeight === null && strippingWeight === null && !errorMessage) {
         errorMessage = 'Could not identify Waste Weight or Stripping Weight from the image.';
      }

      return {
        wasteWeight: wasteWeight,
        strippingWeight: strippingWeight,
        errorMessage: errorMessage,
      };
    } catch (e: any) {
      console.error('Error in readHandwrittenWeightsFlow:', e);
      return {
        wasteWeight: null,
        strippingWeight: null,
        errorMessage: e.message || 'An unexpected error occurred during OCR processing.',
      };
    }
  }
);
