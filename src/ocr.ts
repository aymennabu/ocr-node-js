import {
  processDocument,
  processDocumentFromAzure,
  processDocumentFromTextract,
} from "./client";

export default async function doubleOcr(inputData: Buffer) {
  const googleOcrFirstTime = await processDocument(inputData);

  if (googleOcrFirstTime === "FAILED") {
    throw new Error("ocr-failed")
  }

  const postProcessedImageBytes =
    googleOcrFirstTime.document.pages[0].image.content;

  const googleAzureTextractOcr = await Promise.all([
    processDocument(postProcessedImageBytes, true),
    processDocumentFromAzure(postProcessedImageBytes),
    processDocumentFromTextract(postProcessedImageBytes),
  ]);

  return googleAzureTextractOcr;
}
