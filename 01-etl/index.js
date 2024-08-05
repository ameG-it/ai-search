console.log("処理開始");
const { PdfReader } = require("./pdfreader.js");
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

  data.push(...chunks);

  return data;
}

(async () => {
  // Extract
  const indata = await extract();

  //Transform
  const outdata = [];
  for (let source of indata) {
    const target = await transform(source);
    outdata.push(target);
  }

  console.log(JSON.stringify(outdata));
})();
