
"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import CalculatorWrapper from '@/components/calculators/CalculatorWrapper';
import CommonInput from '@/components/calculators/CommonInput';
import ResultDisplay from '@/components/calculators/ResultDisplay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { HelpCircle, UploadCloud, XCircle, Loader2, ScanText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { readHandwrittenWeights, type ReadHandwrittenWeightsOutput } from '@/ai/flows/read-handwritten-weights-flow';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

const WasteStrippingOcrCalculatorLogic: React.FC = () => {
  const { toast } = useToast();
  const [batchWeight, setBatchWeight] = useState<string>('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [ocrResult, setOcrResult] = useState<ReadHandwrittenWeightsOutput | null>(null);
  const [finalNetWeight, setFinalNetWeight] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // Max 4MB
        toast({
          variant: "destructive",
          title: "Image Too Large",
          description: "Please upload an image smaller than 4MB.",
        });
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setOcrResult(null);
        setFinalNetWeight(null);
        setOcrError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setUploadedImage(null);
    setImageFile(null);
    setOcrResult(null);
    setFinalNetWeight(null);
    setOcrError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; 
    }
  };

  const handleAnalyzeAndCalculate = async () => {
    if (!imageFile) {
      toast({ variant: "destructive", title: "No Image", description: "Please upload an image first." });
      return;
    }
    if (!batchWeight || isNaN(parseFloat(batchWeight))) {
        toast({ variant: "destructive", title: "Invalid Batch Weight", description: "Please enter a valid number for batch weight." });
        return;
    }

    setIsLoading(true);
    setOcrError(null);
    setOcrResult(null);
    setFinalNetWeight(null);

    try {
      const imageDataUri = uploadedImage; 
      if (!imageDataUri) {
        throw new Error("Failed to read image data.");
      }

      const result = await readHandwrittenWeights({ imageDataUri });
      setOcrResult(result);

      if (result.errorMessage) {
        setOcrError(result.errorMessage);
      }

      const bw = parseFloat(batchWeight);
      const waste = result.wasteWeight ?? 0;
      const stripping = result.strippingWeight ?? 0;
      
      if (!isNaN(bw)) {
        setFinalNetWeight(bw - waste - stripping);
      } else {
        setFinalNetWeight(null);
      }

    } catch (error: any) {
      console.error("OCR Error:", error);
      setOcrError(error.message || "Failed to analyze image.");
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formula = "Net Weight = Batch Weight - (Recognized Waste Weight) - (Recognized Stripping Weight)";
  
  const resultsToCopy = useMemo(() => {
    let text = "Handwritten Weights OCR Calculation:\n";
    text += `Batch Weight: ${batchWeight}\n`;
    if (ocrResult) {
      text += `Recognized Waste Weight: ${ocrResult.wasteWeight ?? 'N/A'}\n`;
      text += `Recognized Stripping Weight: ${ocrResult.strippingWeight ?? 'N/A'}\n`;
      if (ocrResult.errorMessage) {
        text += `OCR Issues: ${ocrResult.errorMessage}\n`;
      }
    }
    if (finalNetWeight !== null) {
      text += `Final Net Weight: ${finalNetWeight.toFixed(3)}\n`;
    }
    return text;
  }, [batchWeight, ocrResult, finalNetWeight]);


  return (
    <CalculatorWrapper
      title="Handwritten Weights OCR Calculator"
      description="Upload an image of handwritten waste and stripping weights. The AI will attempt to read them, and then calculate the net weight against your batch weight."
      formula={formula}
      resultsToCopy={resultsToCopy}
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="image-upload">Upload Image of Weights</Label>
          <Input
            id="image-upload"
            type="file"
            accept="image/png, image/jpeg, image/webp"
            onChange={handleImageUpload}
            ref={fileInputRef}
            className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          />
          <p className="text-xs text-muted-foreground">Supports PNG, JPG, WEBP. Max 4MB.</p>
        </div>

        {uploadedImage && (
          <div className="relative group">
            <Image
              src={uploadedImage}
              alt="Uploaded weights"
              width={400}
              height={300}
              className="rounded-md border object-contain max-h-80 w-auto mx-auto"
              data-ai-hint="document weights"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-background/70 hover:bg-destructive/80 hover:text-destructive-foreground rounded-full h-8 w-8"
              onClick={clearImage}
              aria-label="Clear image"
            >
              <XCircle className="h-5 w-5" />
            </Button>
          </div>
        )}

        <CommonInput
          id="batchWeightOcr"
          label="Batch Weight"
          unit="units"
          value={batchWeight}
          onChange={(e) => setBatchWeight(e.target.value)}
          placeholder="e.g., 1000"
          tooltipText="Enter the total starting batch weight in the same units as the handwritten weights."
        />

        <Button onClick={handleAnalyzeAndCalculate} disabled={isLoading || !uploadedImage || !batchWeight} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing & Calculating...
            </>
          ) : (
            <>
              <ScanText className="mr-2 h-4 w-4" />
              Analyze Image & Calculate
            </>
          )}
        </Button>

        {ocrError && (
           <Alert variant="destructive">
            <XCircle className="h-4 w-4"/>
            <AlertTitle>OCR Error</AlertTitle>
            <AlertDescription>{ocrError}</AlertDescription>
          </Alert>
        )}
        
        {(ocrResult && !ocrError && ocrResult.wasteWeight === null && ocrResult.strippingWeight === null) && (
           <Alert variant="default" className="bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400">
            <HelpCircle className="h-4 w-4"/>
            <AlertTitle>OCR Result</AlertTitle>
            <AlertDescription>Could not confidently identify waste or stripping weights from the image. Please ensure the image is clear and handwriting is legible.</AlertDescription>
          </Alert>
        )}


        {ocrResult && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <ResultDisplay label="Recognized Waste Weight" value={ocrResult.wasteWeight} unit="units" />
            <ResultDisplay label="Recognized Stripping Weight" value={ocrResult.strippingWeight} unit="units" />
          </div>
        )}
        
        <ResultDisplay label="Final Net Weight" value={finalNetWeight} unit="units" variant="highlight" />
      </div>
      
      <div className="mt-8 pt-6 border-t">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full md:w-auto">
              <HelpCircle className="mr-2 h-4 w-4" /> How to use this calculator
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">How to Use the Handwritten Weights OCR Calculator</DialogTitle>
              <DialogDescription>
                This tool uses AI to read handwritten "Waste Weight" and "Stripping Weight" from an uploaded image, then subtracts them from a Batch Weight.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm py-4">
              <section>
                <h4 className="font-semibold text-md mb-2">1. Upload Image</h4>
                <p className="mb-1 text-muted-foreground">
                  Click "Choose File" and select a clear image (PNG, JPG, WEBP, max 4MB) of the document containing the handwritten waste and stripping weights. For best results, ensure the handwriting is legible and the image is well-lit.
                </p>
              </section>
              <section>
                <h4 className="font-semibold text-md mb-2">2. Enter Batch Weight</h4>
                <p className="mb-1 text-muted-foreground">
                  Input the total starting weight of your batch. This should be in the same units as the weights in the image.
                </p>
                <div className="my-1 p-2 text-xs bg-muted border border-dashed rounded-md text-foreground/80">e.g., <span className="font-mono p-1 bg-background rounded">1000 units</span></div>
              </section>
              <section>
                <h4 className="font-semibold text-md mb-2">3. Analyze & Calculate</h4>
                <p className="mb-1 text-muted-foreground">
                  Click the "Analyze Image & Calculate" button. The AI will process the image. This may take a few seconds.
                </p>
              </section>
              <section>
                <h4 className="font-semibold text-md mb-2">4. Review Results</h4>
                <ul className="list-disc list-inside space-y-1 pl-4 text-muted-foreground">
                  <li><strong>Recognized Weights:</strong> The calculator will display the numbers it identified as "Waste Weight" and "Stripping Weight". If a value couldn't be read, it will show "N/A" or 0 in calculation.</li>
                  <li><strong>Final Net Weight:</strong> This is calculated as: Batch Weight - Waste Weight - Stripping Weight.</li>
                  <li><strong>Error Messages:</strong> If the AI encounters issues (e.g., unreadable image, no numbers found), an error or warning message will appear.</li>
                </ul>
                <p className="mt-2 text-muted-foreground">
                  <strong>Note on Accuracy:</strong> OCR for handwriting can be challenging. Results may not always be 100% accurate. Always double-check critical values.
                </p>
              </section>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CalculatorWrapper>
  );
};

export default WasteStrippingOcrCalculatorLogic;
