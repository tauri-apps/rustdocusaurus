// Will also define the order in the sidebar
const itemsReference = {
  module: {},
  enum: [],
  fn: [],
  struct: [],
  trait: [],
  type: [],
};

const clone = (item) => JSON.parse(JSON.stringify(item));

module.exports = {
  itemsReference,
  clone,
};
