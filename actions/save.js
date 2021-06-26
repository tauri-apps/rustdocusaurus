const fs = require("fs").promises;
const { itemsReference } = require("../common");
const { capitalize } = require("../utils/string");
const keys = Object.keys(itemsReference);

const save = async (docs, originPath, targetPath, crate) => {
  const promises = keys.map(async (key) => {
    if (key === "module") {
      for (const path in docs.module) {
        await save(docs.module[path], originPath, targetPath, crate);
      }
      return;
    }
    const res = docs[key].map(async (item) => {
      const path = item.path
        .replace(originPath, targetPath)
        .replace(/.html$/, ".md");
      const title = path.split("/").pop().replace(".md", "");

      const structName = item.path
        .replace(originPath, "")
        .replace(/.html$/, "")
        .split("/");
      structName[structName.length - 1] = structName[structName.length - 1]
        .split(".")
        .pop();

      const content = `---
title: ${capitalize(key) + " " + structName.join("::")}
sidebar_label: ${title}
custom_edit_url: null
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
