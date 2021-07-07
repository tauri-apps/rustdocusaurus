const fs = require("fs").promises;
const jsdom = require("jsdom");
const { clone, itemsReference } = require("../common");

const keys = Object.keys(itemsReference);

const { JSDOM } = jsdom;

const getItemFromPath = async (path) => {
  const html = await fs.readFile(path, "utf-8");
  return {
    path,
    content: new JSDOM(html),
  };
};

const extract = async (docs) => {
  const extractedContent = clone(docs);
  const promises = keys.map(async (key) => {
    if (key === "module") {
      for (const path in extractedContent.module) {
        extractedContent.module[path] = await extract(
          extractedContent.module[path]
        );
      }
      return;
    }
    const res = extractedContent[key].map(getItemFromPath);

    return extractedContent[key] = (await Promise.all(res))
      .filter((item) => item.content.window.document.getElementById("main"))
      .map(({ path, content }) => ({
        path,
        content: content.window.document.getElementById("main").innerHTML,
      }));
  });
  await Promise.all(promises);
  return extractedContent;
};

module.exports = extract;
