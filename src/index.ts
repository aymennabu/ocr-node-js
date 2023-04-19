import doubleOcr from "./ocr";

export default async function applyOcr(inputData: Buffer): Promise<string> {
  const googleAzureTextractOcr = await doubleOcr(inputData);

  if (
    googleAzureTextractOcr[0] === "FAILED" ||
    googleAzureTextractOcr[1] === "FAILED" ||
    googleAzureTextractOcr[2] === "FAILED"
  ) {
    throw new Error("ocr-failed");
  }

  const response = JSON.stringify({
    document_ai_response: googleAzureTextractOcr[0],
    azure_vision_output: googleAzureTextractOcr[1],
    textract_output: googleAzureTextractOcr[2],
  });

  return response;
}
