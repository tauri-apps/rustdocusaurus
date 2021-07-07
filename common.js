// Modified by side-effect; will also define the order in the sidebar
const itemsReference = {
  index: [],
  module: {},
  enum: [],
  fn: [],
  struct: [],
  trait: [],
  type: [],
  macro: [],
  constant: [],
  attr: [],
};

const clone = (item) => JSON.parse(JSON.stringify(item));

module.exports = {
  itemsReference,
  clone,
};
