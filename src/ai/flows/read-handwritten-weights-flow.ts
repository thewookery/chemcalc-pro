/**
 * @fileOverview Client-compatible OCR flow for handwritten waste & stripping weights.
 */

export interface ReadHandwrittenWeightsInput {
  imageDataUri: string;
}

export interface ReadHandwrittenWeightsOutput {
  wasteWeight: number | null;
  strippingWeight: number | null;
  errorMessage?: string;
}

export async function readHandwrittenWeights(
  input: ReadHandwrittenWeightsInput
): Promise<ReadHandwrittenWeightsOutput> {
  const apiKey =
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    (typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') : null);

  if (!apiKey) {
    return {
      wasteWeight: null,
      strippingWeight: null,
      errorMessage:
        'To use OCR on GitHub Pages, set NEXT_PUBLIC_GEMINI_API_KEY or enter weights manually.',
    };
  }

  try {
    const match = input.imageDataUri.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (!match) {
      return {
        wasteWeight: null,
        strippingWeight: null,
        errorMessage: 'Invalid image data format.',
      };
    }
    const mimeType = match[1];
    const data = match[2];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Analyze this image of an industrial document/weight slip. Extract the handwritten numbers for 'Waste Weight' and 'Stripping Weight'. Return ONLY a JSON object with keys "wasteWeight" (number or null), "strippingWeight" (number or null), and "errorMessage" (string or null).`,
                },
                {
                  inlineData: {
                    mimeType,
                    data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.0,
          },
        }),
      }
    );

    if (!response.ok) {
      return {
        wasteWeight: null,
        strippingWeight: null,
        errorMessage: `Gemini API returned status ${response.status}`,
      };
    }

    const json = await response.json();
    const candidateText = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      return {
        wasteWeight: null,
        strippingWeight: null,
        errorMessage: 'No response content from Gemini.',
      };
    }

    const parsed = JSON.parse(candidateText);
    return {
      wasteWeight: typeof parsed.wasteWeight === 'number' ? parsed.wasteWeight : null,
      strippingWeight: typeof parsed.strippingWeight === 'number' ? parsed.strippingWeight : null,
      errorMessage: parsed.errorMessage || undefined,
    };
  } catch (err: any) {
    return {
      wasteWeight: null,
      strippingWeight: null,
      errorMessage: err.message || 'Error communicating with Gemini OCR.',
    };
  }
}
