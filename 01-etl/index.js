console.log("処理開始");
const { OpenAIEmbeddings } = require("@langchain/openai");
const { PdfReader } = require("./pdfreader.js");
const { v4: uuid } = require("uuid");
const { TokenTextSplitter } = require("langchain/text_splitter");
const axios = require("axios");

async function extract() {
  const FILE_NAME = "xxx";
  const FILE_PATH = "./data/xxx";

  return new Promise((resolve, reject) => {
    const data = [];
    const reader = new PdfReader();
    reader.on("page", ({ pageNumber, text }) => {
      data.push({
        title: FILE_NAME,
        pageNumber: pageNumber,
        text: text,
      });
    });
    reader.on("done", () => {
      resolve(data);
    });
    reader.read(FILE_PATH);
  });
}

async function transform(item) {
  const data = [];
  const splitter = new TokenTextSplitter({
    encodingName: "cl100k_base",
    chunkSize: 2000,
    chunkOverlap: 200,
  });
  const chunks = await splitter.splitText(item.text);

  // chunk into vector
  const embeddings = new OpenAIEmbeddings({
    azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
    azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_INSTANCE_NAME,
    azureOpenAIApiDeploymentName:
      process.env.AZURE_OPENAI_EMBED_DEPLOYMENT_NAME,
    azureOpenAIApiVersion: process.env.AZURE_OPENAI_EMBED_API_VERSION,
  });

  // Promise.all(chunks.map((chunk) => embeddings.embedQuery(chunk))).then(
  //   (vectors) => {
  //     console.log("chunk", chunk);

  //     console.log("vectors", vectors);
  //     data.push({
  //       id: uuid(),
  //       title: `${item.title} - Page ${item.pageNumber}`,
  //       content: chunk,
  //       contentVector: vector,
  //     });
  //   }
  // );

  for (let chunk of chunks) {
    const vector = await embeddings.embedQuery(chunk);
    data.push({
      id: uuid(),
      title: `${item.title} - Page ${item.pageNumber}`,
      content: chunk,
      contentVector: vector,
    });
  }

  return data;
}

async function load(documents) {
  const BASE_URL = process.env.AZURE_AISEARCH_BASE_URL;
  const ADMIN_KEY = process.env.AZURE_AISEARCH_ADMIN_KEY;
  const INDEX_NAME = process.env.AZURE_AISEARCH_INDEX_NAME;

  const url = new URL(BASE_URL);
  url.pathname = `/indexes/${INDEX_NAME}/docs/index`;
  url.searchParams.append("api-version", "2023-11-01");

  const res = await axios({
    method: "POST",
    url: url.toString(),
    headers: {
      "Content-Type": "application/json",
      "api-key": ADMIN_KEY,
    },
    data: {
      value: documents,
    },
  });
}

(async () => {
  // Extract
  console.log("Extracting...");
  const indata = await extract();

  // Transform
  console.log("Transforming...");
  const outdata = [];
  for (let source of indata) {
    const target = await transform(source);
    outdata.push(...target);
  }

  // Load
  console.log("Loading...");
  await load(outdata);

  console.log("Done!");
})();
