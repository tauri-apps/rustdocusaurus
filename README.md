# rustdocusaurus

Experiment to turn a rustdoc generated site into MDX content.

## Usage

**Once you have generated your Rust documentation**, you may use this kind of script:

```js
const { transformDocs } = require("./main");
const generateSidebar = require("./generateSidebar");
const fs = require("fs").promises;

// Where your docs live, should be the folder containing the crates docs
const originPath = "/path/to/project/target/doc/";

// Where you'll save your MD files
const targetPath =
  "/path/to/docusaurus/website/docs/api/rust/";

/*
Where lives your sidebars config file
Doesn't have to be JSON but it's easier to change programmatically, 
you may create your own saving method
*/
const sidebarPath =
  "/path/to/docusaurus/website/sidebars.json";

// rustdoc uses relative links for crate types relations
const linksRoot = "/docs/api/rust/";

(async () => {
  const sidebarItems = (
    await Promise.all(
      [
        "crate1", // Specify which crates you want to process
        "crate2",
        "crate3"
      ].map(async (crateName) => ({
        crateName,
        docs: await transformDocs(
          originPath + crateName,
          originPath,
          targetPath
        ),
      }))
    )
  ).map((item) => generateSidebar(item.docs, item.crateName, originPath));

  // Automatically add the sidebar items to Docusaurus sidebar file config
  const sidebarContent = JSON.parse(await fs.readFile(sidebarPath, "utf-8"));
  sidebarContent.docs[3].items[2].items = sidebarItems; // Specify where to put the items
  fs.writeFile(sidebarPath, JSON.stringify(sidebarContent, null, 2));

  console.log("Tasks completed!");
})();

```