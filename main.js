const explore = require("./actions/explore");
const extract = require("./actions/extract");
const transform = require("./actions/transform");
const save = require("./actions/save");

const transformDocs = async (cratePath, originPath, targetPath) => {
  const crateName = cratePath.split("/").pop();

  const docs = await explore(cratePath);
  const contents = await extract(docs,);
  const results = await transform(contents, crateName);
  await save(results, originPath, targetPath);

  return results;
};

module.exports = {
  transformDocs,
};
