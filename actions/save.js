const fs = require("fs").promises;
const { itemsReference } = require("../common");
const { capitalize } = require("../utils/string");
const keys = Object.keys(itemsReference);

const getFrontMatter = (title, sidebarLabel) => `---
title: ${title}
sidebar_label: ${sidebarLabel}
custom_edit_url: null
---
`;

const save = async (docs, originPath, targetPath, crate) => {
  const getContent = (item, key) => {
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
  
    return `${getFrontMatter(
      capitalize(key) + " " + structName.join("::"),
      title
    )}
  ${item.content}
  `;
  };


  const promises = keys.map(async (key) => {
    if (key === "module") {
      for (const path in docs.module) {
        await save(docs.module[path], originPath, targetPath, crate);
      }
      return;
    }
    if (key === "index" && docs.index[0]) {
      const title = "Table of contents";
      docs.index[0].path = docs.index[0].path.replace("all.html", "index");
      await fs.mkdir(targetPath + crate, { recursive: true });
      return fs.writeFile(targetPath + crate + "/index.md", `${getFrontMatter(title, title)}
${docs.index[0].content}`);
    }
    const res = docs[key].map(async (item) => {
      const content = getContent(item, key);
      const path = item.path.replace(originPath, targetPath).replace(/.html$/, ".md")
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
