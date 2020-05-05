const explore = require("./explore");
const extract = require("./extract");
const transform = require("./transform");
const save = require("./save");
const generateSidebar = require("./generateSidebar");

const fs = require("fs").promises;

const transformDocs = async (cratePath, sidebarPath) => {
  const crateName = cratePath.split("/").pop();

  const docs = await explore(cratePath);
  const contents = await extract(docs);
  const results = await transform(contents, crateName);
  const sidebarContent = JSON.parse(await fs.readFile(sidebarPath, "utf-8"));
  const sidebarItems = generateSidebar(contents, crateName);
  sidebarContent.docs[3].items[2].items = [sidebarItems];
  fs.writeFile(sidebarPath, JSON.stringify(sidebarContent, null, 2));

  await save(results);

  console.log("Done!");
};

module.exports = {
  transformDocs,
};
