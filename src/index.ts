import processOcr from "./ocr";
/** TODO FIND GOOD SCHEMA
import Ajv from "ajv";
import { azureSchema, googleSchema, textractSchema } from "./schema";
*/

export default async function applyOcr(inputData: Buffer): Promise<string> {
  const googleAzureTextractOcr = await processOcr(inputData);

  /**
   * TODO FIND GOOD SCHEMA
  let errors = 0;
  const ajv = new Ajv();

  if (
    googleAzureTextractOcr[0] === "FAILED" ||
    !ajv.compile(googleSchema)(googleAzureTextractOcr[0])
  ) {
    errors += 1;
  }

  if (
    googleAzureTextractOcr[1] === "FAILED" ||
    !ajv.compile(azureSchema)(googleAzureTextractOcr[1])
  ) {
    errors += 1;
  }

  if (
    googleAzureTextractOcr[2] === "FAILED" ||
    !ajv.compile(textractSchema)(googleAzureTextractOcr[2])
  ) {
    errors += 1;
  }

  if (errors === 3) {
    throw new Error("ocr-failed")
  }
*/

  if (
    googleAzureTextractOcr[0] === "FAILED" &&
    googleAzureTextractOcr[1] === "FAILED" &&
    googleAzureTextractOcr[2] === "FAILED"
  ) {
    throw new Error("ocr-failed");
  }

  const response = JSON.stringify({
    document_ai_response:
      googleAzureTextractOcr[0] === "FAILED"
        ? undefined
        : googleAzureTextractOcr[0],
    azure_vision_output:
      googleAzureTextractOcr[1] === "FAILED"
        ? undefined
        : googleAzureTextractOcr[1],
    textract_output:
      googleAzureTextractOcr[2] === "FAILED"
        ? undefined
        : googleAzureTextractOcr[2],
  });

  return response;
}
