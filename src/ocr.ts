import {
  processDocument,
  processDocumentFromAzure,
  processDocumentFromTextract,
} from "./client";

export default async function processOcr(inputData: Buffer) {
  const googleAzureTextractOcr = await Promise.all([
    processDocument(inputData, true),
    processDocumentFromAzure(inputData),
    processDocumentFromTextract(inputData),
  ]);

  return googleAzureTextractOcr;
}
