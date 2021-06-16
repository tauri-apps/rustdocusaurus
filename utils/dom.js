const removeChildren = (parent) => {
  while (parent.lastChild) {
    parent.removeChild(parent.lastChild);
  }
};

const insertAfter = (document, newNode, referenceNode) => {
  if (!referenceNode.nextSibling) {
    const sibling = document.createElement("div")
    referenceNode.parentNode.appendChild(sibling);
  }
  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
};

module.exports = {
  removeChildren,
  insertAfter
};
