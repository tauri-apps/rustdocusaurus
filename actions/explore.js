const fs = require("fs").promises;
const merge = require("deepmerge");
const { itemsReference, clone } = require("../common");

const isStorable = (node) =>
  !["all.html", "index.html", "sidebar-items.js"].includes(node);

const determineType = (node) => node.split(".").shift();

const explore = async (directory) => {
  const nodes = await fs.readdir(directory);
  const storedItems = nodes.map(async (node) => {
    const items = clone(itemsReference);
    const path = directory + "/" + node;
    const stats = await fs.lstat(path);

    if (stats.isDirectory()) {
      const subItems = await explore(path);
      items.module[path] = subItems;
    } else if (isStorable(node)) {
      items[determineType(node)].push(path);
    } else if (node === "all.html") {
      items.index.push(path);
    }
    return items;
  });
  const result = await Promise.all(storedItems);
  return merge.all(result);
};

module.exports = explore;
