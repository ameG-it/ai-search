const { EventEmitter } = require("events");

class Reader extends EventEmitter {
  constructor() {
    super();
  }

  async read(filepath) {
    const { PdfReader } = await import("pdfreader");
    const reader = new PdfReader();

    let pageNumber = 0;
    let lineHeight = 0;
    let text = "";
    reader.parseFileItems(filepath, (err, item) => {
      if (err) {
        console.error(err);
        return;
      }

      // 読み込めるページがなくなったら出力
      if (!item) {
        this.emit("page", { pageNumber, text });
        this.emit("done");
      } else if (item.page) {
        pageNumber && this.emit("page", { pageNumber, text });
        pageNumber = item.page;
        lineHeight = 0;
        text = "";
      } else if (item.text) {
        if (lineHeight === item.y || !lineHeight) {
          text += item.text;
        } else {
          text += "\n" + item.text;
        }
        lineHeight = item.y;
      }
    });
  }
}

module.exports = {
  PdfReader: Reader,
};

function onpage({ pageNumber, text }) {
  console.log(`Page:${pageNumber} text: ${text}`);
}

function ondone() {
  console.log("Done!");
}
