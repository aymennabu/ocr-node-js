import { DocumentProcessorServiceClient } from "@google-cloud/documentai";
import {
  TextractClient,
  DetectDocumentTextCommand,
} from "@aws-sdk/client-textract";

import { CognitiveServicesCredentials } from "ms-rest-azure";
import { ComputerVisionClient } from "azure-cognitiveservices-computervision";

import { env } from "./utils";

export const processDocument = async (binaryDocument: Buffer, deleteImage: boolean = false): Promise<any> => {
  const projectId = env("PROJECT_ID");
  const location = env("LOCATION");
  const processorId = env("PROCESSOR_ID");

  const client = new DocumentProcessorServiceClient({
    credentials: {
      private_key: env("GCP_PRIVATE_KEY").replace("\\n", "\n"),
      client_email: env("GCP_CLIENT_EMAIL"),
      client_id: env("GCP_CLIENT_ID"),
      token_url: env("GCP_TOKEN_URI"),
    },
    apiEndpoint: `${location}-documentai.googleapis.com`,
  });

  const processorPath = client.processorPath(projectId, location, processorId);

  const { fileTypeFromBuffer } = await (eval('import("file-type")') as Promise<
    typeof import("file-type")
  >);

  const mimeType = (await fileTypeFromBuffer(binaryDocument))?.mime;

  const rawDocument = {
    content: binaryDocument,
    mimeType: mimeType,
  };

  const request = {
    name: processorPath,
    rawDocument: rawDocument,
  };

  let result: any;
  try {
    const [operation] = await client.processDocument(request);
    result = operation;
  } catch (e) {
    result = "FAILED";
  }

  if (deleteImage && result && result !== "FAILED") {
    delete result.document.pages[0].image.content;
  }

  return result;
};

export const processDocumentFromTextract = async (
  binaryDocument: Buffer
): Promise<any> => {
  const accessKeyId = env("AWS_ACCESS_KEY_ID");
  const secretAccessKey = env("AWS_SECRET_ACCESS_KEY");
  const region = env("AWS_REGION_NAME");

  const textractClient = new TextractClient({
    credentials: {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
    },
    region,
  });

  const params = {
    Document: {
      Bytes: binaryDocument,
    },
  };

  const command = new DetectDocumentTextCommand(params);
  const response = await new Promise((resolve) => {
    textractClient
      .send(command)
      .then((data) => {
        resolve(data);
      })
      .catch((_) => {
        resolve("FAILED");
      });
  });

  return response;
};

export const processDocumentFromAzure = async (
  binaryDocument: Buffer
): Promise<any> => {
  const subscriptionKey = env("AZURE_SUBSCRIPTION_KEY");
  const endpoint = env("AZURE_OCR_ENDPOINT");

  const credentials = new CognitiveServicesCredentials(subscriptionKey);
  const client = new ComputerVisionClient(credentials, endpoint);

  const response = await client.recognizeTextInStreamWithHttpOperationResponse(
    binaryDocument,
    "Printed"
  );
  if (response) {
    const operationLocation = response.response.headers['operation-location'] as string;
    if (operationLocation) {
      const operationId = operationLocation.split("/").pop();
      let readResult;
      if (operationId) {
        let timeoutCounter = 0;

        while (true) {
          readResult = await azureReadProcessWrapper(client, operationId);
          if (
            readResult.status !== "notStarted" &&
            readResult.status !== "Running"
          ) {
            break;
          }
          if (timeoutCounter > 5) {
            readResult = "FAILED";
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 1000));
          timeoutCounter++;
        }
      }
      return readResult;
    }
  }
  return "FAILED"
};

async function azureReadProcessWrapper(client: any, operationId: string) {
  const result = await client.getReadOperationResultWithHttpOperationResponse(
    operationId
  );
  return result.body;
}
