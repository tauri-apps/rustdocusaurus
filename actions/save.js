const fs = require("fs").promises;
const { itemsReference } = require("../common");
const keys = Object.keys(itemsReference);

const save = async (docs, originPath, targetPath) => {
  const promises = keys.map(async (key) => {
    if (key === "module") {
      for (const path in docs.module) {
        await save(docs.module[path], originPath, targetPath);
      }
      return;
    }
    const res = docs[key].map(async (item) => {
      const path = item.path
        .replace(originPath, targetPath)
        .replace(/.html$/, ".md");
      const title = path.split("/").pop().replace(".md", "");

      const content = `---
title: "${title}"
---

${item.content}
`;
      const s = path.split("/");
      s.pop();
      const targetDirectory = s.join("/");
      await fs.mkdir(targetDirectory, { recursive: true });
      return fs.writeFile(path, content);
    });
    await Promise.all(res);
    // extractedContent[key] = await Promise.all(res);
  });
  await Promise.all(promises);
};

module.exports = save;
