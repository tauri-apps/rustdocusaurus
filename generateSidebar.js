const { itemsReference } = require("./common");
const keys = Object.keys(itemsReference);

const generateSidebar = (contents, label) => {
  const out = {
    label,
    type: "category",
    items: [],
  };
  keys.forEach((key) => {
    if (key === "module") {
      for (const path in contents.module) {
        const moduleLabel = path.split("/").pop();
        out.items.push(generateSidebar(contents.module[path], moduleLabel));
      }
      return;
    }
    contents[key].forEach((item) => {
      out.items.push(
        item.path.replace(
          "/home/laegel/Workspace/perso/tauri/target/doc/",
          `api/rust/`
        ).replace(".html", "")
      );
    });
  });
  return out;
};

module.exports = generateSidebar;
