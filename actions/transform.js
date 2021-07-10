const jsdom = require("jsdom");
const { clone, itemsReference } = require("../common");
const pretty = require("pretty");
const { removeChildren, insertAfter } = require("../utils/dom");

const unified = require("unified");
const parse = require("rehype-parse");
const toMdast = require("hast-util-to-mdast");
const stringify = require("remark-stringify");

const keys = Object.keys(itemsReference);
const { JSDOM } = jsdom;

const isRelativeLink = (link) => !link.startsWith("http");

const serializeDOM = (dom) => pretty(dom.window.document.body.innerHTML);

const transformLinks = (dom, crate) => {
  Array.from(dom.window.document.querySelectorAll("a")).forEach((anchor) => {
    if (isRelativeLink(anchor.href)) {
      anchor.href =
        `/docs/api/rust/${crate}/` + anchor.href.replace(".html", "");
    }
  });
};

const getFilePathInCrate = (file) => {
  const parts = file.match(/(?:\.\.\/)+src\/([^\/]*)/);
  const targetCrate = parts[parts.length - 1].replace(/_/g, "-");
  const filePath = file.replace(/(?:\.\.\/)+src\/(?:.*)\//, "");
  return `core/${targetCrate}/src/${filePath}`;
};

const transformSourceLinks = (dom, crate, repositoryInfo) => {
  const getGitHubURL = (fileName) => {
    return [
      `https://github.com`,
      repositoryInfo.owner,
      repositoryInfo.project,
      "blob",
      repositoryInfo.revision,
      fileName,
    ].join("/");
  };

  const transformHeader = (header) => {
    const srclink = header.querySelector("a.srclink");
    if (!srclink) {
      return;
    }
    const parts = srclink.href.split("/");
    const file = srclink.href.replace(".html", "").replace("#", "#L");
    srclink.textContent = parts[parts.length - 1]
      .replace(".html", "")
      .replace(/#(.+)/, ":$1");

    const functionName = header.querySelector("code > a").textContent;

    let functionPrototype = header
      .querySelector("code")
      .innerHTML.replace(/\s{4,5}/g, "\n    ");
    if (functionPrototype.match(/\(\n/)) {
      functionPrototype = functionPrototype.replace(") ->", "\n) ->");
    }
    functionPrototype = functionPrototype
      .replace("where", "\nwhere")
      .replace(/(#\[(?:[^\]]*)])/, "$1\n");

    const functionNameWrapper = dom.window.document.createElement("code");
    const prototype = dom.window.document.createElement("pre");
    const wrapper = dom.window.document.createElement("i");
    const text = dom.window.document.createTextNode("Defined in: ");

    functionNameWrapper.textContent = functionName;
    prototype.innerHTML = functionPrototype;
    srclink.href = isRelativeLink(srclink.href)
      ? getGitHubURL(getFilePathInCrate(file))
      : srclink.href;
    srclink.title = "";

    removeChildren(header);
    header.appendChild(functionNameWrapper);
    wrapper.appendChild(text);
    wrapper.appendChild(srclink);

    insertAfter(dom.window.document, prototype, header);

    insertAfter(
      dom.window.document,
      wrapper,
      prototype.nextSibling.classList.contains("docblock")
        ? prototype.nextSibling
        : prototype
    );
  };

  Array.from(dom.window.document.querySelectorAll("h3")).forEach(
    transformHeader
  );
  Array.from(dom.window.document.querySelectorAll("h4")).forEach(
    transformHeader
  );
};

const transformMainHeader = (dom) => {
  const header = dom.window.document.querySelector("h1");
  header.textContent = Array.from(header.querySelectorAll("span")).map(
    (span) => span.textContent
  );
};

const transformSecondaryHeaders = (dom) => {
  Array.from(dom.window.document.querySelectorAll("h1:not(.fqn)")).forEach(
    (header) => {
      const newNode = dom.window.document.createElement("h2");
      newNode.textContent = header.textContent;
      header.parentNode.replaceChild(newNode, header);
    }
  );
};

const removeRustdocTools = (dom) => {
  const selectors = [
    "h1 .srclink",
    "#render-detail",
    "a.anchor",
    ".loading-content",
  ];
  selectors.forEach((selector) => {
    Array.from(
      dom.window.document.querySelectorAll(selector)
    ).forEach((element) => element.parentNode.removeChild(element));
  });
};

const transformCodeBlocks = (dom) => {
  Array.from(dom.window.document.querySelectorAll("pre")).forEach((element) => {
    element.innerHTML = element.innerHTML.replace(/(#\[(?:[^\]]*)])/, "$1\n");
    element.prepend(dom.window.document.createTextNode("```rs\r"));
    element.append(dom.window.document.createTextNode("\r```"));
  });
};

const transform = async (contents, crate, repositoryInfo) => {
  const transformedContents = clone(contents);
  const promises = keys.map(async (key) => {
    if (key === "module") {
      for (const path in transformedContents.module) {
        transformedContents.module[path] = await transform(
          transformedContents.module[path],
          crate,
          repositoryInfo
        );
      }
      return;
    }
    const res = transformedContents[key].map((item) => {
      const dom = new JSDOM(item.content);
      if (repositoryInfo) {
        transformSourceLinks(dom, crate, repositoryInfo);
      }
      removeRustdocTools(dom);
      transformMainHeader(dom);
      transformSecondaryHeaders(dom);
      transformCodeBlocks(dom);
      transformLinks(dom, crate);

      const serialized = serializeDOM(dom);

      const hast = unified().use(parse).parse(serialized);

      const mdast = toMdast(hast);

      let doc = unified().use(stringify).stringify(mdast);

      const docBlocks = doc.match(/ *```rs[\s\S]*```/g);

      if (docBlocks) {
        docBlocks
          .map((codeblock) => [codeblock, codeblock.replace(/^ {4}/gm, "")])
          .forEach(([original, replacement]) => {
            doc = doc.replace(original, replacement);
          });
      }

      return {
        path: item.path,
        content: doc.replace(/!\[/g, "&#33;[").replace(/\s*$/g, ""),
      };
    });
    transformedContents[key] = await Promise.all(res);
    return;
  });
  await Promise.all(promises);
  return transformedContents;
};

module.exports = transform;
