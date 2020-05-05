const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { clone, itemsReference } = require("./common");
const keys = Object.keys(itemsReference);
const fs = require("fs").promises;

const extract = async (docs) => {
  const extractedContent = clone(docs);
  const promises = keys.map(async (key) => {
    if (key === "module") {
      for (const path in extractedContent.module) {
        extractedContent.module[path] = await extract(extractedContent.module[path]);
      }
      return;
    }
    const res = extractedContent[key].map(async (path) => {
      const html = await fs.readFile(path, "utf-8");
      const dom = new JSDOM(html);
      return {
        path,
        content: dom.window.document.getElementById("main").innerHTML,
      };
    });
    extractedContent[key] = await Promise.all(res);
  });
  await Promise.all(promises);
  return extractedContent;
};

module.exports = extract;
