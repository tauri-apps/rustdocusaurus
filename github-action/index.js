const core = require("@actions/core");
const { transformDocs } = require("../main");
const generateSidebar = require("../generateSidebar");
const fs = require("fs").promises;

(async () => {
  try {
    // Where your docs live, should be the folder containing the crates docs
    const originPath = core.getInput("originPath"); // e.g. "/path/to/project/target/doc/";

    // Where you'll save your MD files
    const targetPath = core.getInput("targetPath"); // e.g. "/path/to/docusaurus/website/docs/api/rust/";

    /*
    Where lives your sidebars config file
    Doesn't have to be JSON but it's easier to change programmatically, 
    you may create your own saving method
    */
    const sidebarPath = core.getInput("sidebarPath"); // e.g. "/path/to/docusaurus/website/sidebars.json";

    // rustdoc uses relative links for crate types relations
    const linksRoot = core.getInput("linksRoot"); // e.g. "/docs/api/rust/";

    const cratesToProcess = core.getInput("cratesToProcess").split(",");

    const sidebarItems = (
      await Promise.all(
        cratesToProcess.map(async (crateName) => ({
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
  } catch (error) {
    core.setFailed(error.message);
  }
})();