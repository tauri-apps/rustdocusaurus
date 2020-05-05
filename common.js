const itemsReference = {
  enum: [],
  fn: [],
  module: {},
  struct: [],
  trait: [],
  type: [],
};

const clone = (item) => JSON.parse(JSON.stringify(item));

module.exports = {
  itemsReference,
  clone,
};
