const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { itemsReference } = require("./common");
const keys = Object.keys(itemsReference);
const fs = require("fs").promises;

const save = async (docs) => {
  const promises = keys.map(async (key) => {
    if (key === "module") {
      for (const path in docs.module) {
        await save(docs.module[path]);
      }
      return;
    }
    const res = docs[key].map((item) => {
      const path = item.path
        .replace(
          "/home/laegel/Workspace/perso/tauri/target/doc/",
          "/home/laegel/Workspace/perso/tauri-docs/website/docs/api/rust/"
        )
        .replace(/.html$/, ".md");
      const title = path.split("/").pop().replace(".md", "");

      const buff = Buffer.from(path);
      const id = buff.toString("base64");
      const content = `---
title: "${title}"
---

${item.content}
      `;
      return fs.writeFile(path, content);
    });
    await Promise.all(res);
    // extractedContent[key] = await Promise.all(res);
  });
  await Promise.all(promises);
};

module.exports = save;
