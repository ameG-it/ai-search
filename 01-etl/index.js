console.log("処理開始");
const { OpenAIEmbeddings } = require("@langchain/openai");
const { PdfReader } = require("./pdfreader.js");
const { v4: uuid } = require("uuid");
const { TokenTextSplitter } = require("langchain/text_splitter");

async function extract() {
  const FILE_NAME = "./data/sample.pdf";
  const FILE_PATH = "./data/sample.pdf";

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
    chunkSize: 10,
    chunkOverlap: 1,
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

  for (let chunk of chunks) {
    const vector = await embeddings.embedQuery(chunk);
    data.push({
      id: uuid(),
      title: item.title,
      content: chunk,
      contentVector: vector,
    });
  }

  //  data.push(...chunks);

  return data;
}

(async () => {
  // Extract
  const indata = await extract();

  //Transform
  const outdata = [];
  for (let source of indata) {
    const target = await transform(source);
    outdata.push(...target);
  }

  console.log(JSON.stringify(outdata, null, 2));
})();
