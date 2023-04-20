import applyOcr from "../src/index";
import * as client from "../src/client";

const sinon = require("sinon")

describe("OCR tests", () => {
  afterEach(() => {
    sinon.restore()
  });

  test("Successful OCR", async () => {
    const mockResponse = {
      document: {
        pages: [{ image: { content: "mock-image-content" } }],
      },
    };
    const mockProcessDocument = sinon.stub(client, 'processDocument').resolves(mockResponse)
    const mockProcessDocumentFromAzure = sinon.stub(client, 'processDocumentFromAzure').resolves("mock-azure-output");
    const mockProcessDocumentFromTextract = sinon.stub(client, 'processDocumentFromTextract').resolves('mock-textract-output');

    const inputData = Buffer.from("mock-input-data");
    const expectedOutput = {
      document_ai_response: mockResponse,
      azure_vision_output: "mock-azure-output",
      textract_output: "mock-textract-output",
    };

    const output = await applyOcr(inputData);

    sinon.assert.calledOnce(mockProcessDocument)
    sinon.assert.calledOnce(mockProcessDocumentFromAzure)
    sinon.assert.calledOnce(mockProcessDocumentFromTextract)
    expect(output).toEqual(JSON.stringify(expectedOutput));
  });

  test("OCR still work if one respond 200", async () => {
    const mockProcessDocument = sinon.stub(client, 'processDocument').resolves('FAILED')
    const mockProcessDocumentFromAzure = sinon.stub(client, 'processDocumentFromAzure').resolves("FAILED");
    const mockProcessDocumentFromTextract = sinon.stub(client, 'processDocumentFromTextract').resolves("mock-textract-output");

    const inputData = Buffer.from("mock-input-data");

    const expectedOutput = {
      textract_output: "mock-textract-output",
    };
    const output = await applyOcr(inputData);

    sinon.assert.calledOnce(mockProcessDocument)
    sinon.assert.calledOnce(mockProcessDocumentFromAzure)
    sinon.assert.calledOnce(mockProcessDocumentFromTextract)
    expect(output).toEqual(JSON.stringify(expectedOutput));
  });

  test('OCR will fails if three of the OCR fail', async () => {
    const mockProcessDocument = sinon.stub(client, 'processDocument').resolves('FAILED')
    const mockProcessDocumentFromAzure = sinon.stub(client, 'processDocumentFromAzure').resolves("FAILED");
    const mockProcessDocumentFromTextract = sinon.stub(client, 'processDocumentFromTextract').resolves("FAILED");

    const inputData = Buffer.from("mock-input-data");

    await expect(applyOcr(inputData)).rejects.toThrow('ocr-failed');

    sinon.assert.calledOnce(mockProcessDocument)
    sinon.assert.calledOnce(mockProcessDocumentFromAzure)
    sinon.assert.calledOnce(mockProcessDocumentFromTextract)
  })

})
