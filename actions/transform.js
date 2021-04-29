const jsdom = require("jsdom");
const TurndownService = require("turndown");
const { clone, itemsReference } = require("../common");
const pretty = require("pretty");

// const Entities = require('html-entities').AllHtmlEntities;

// const entities = new Entities();

// const HTMLParser = require('node-html-parser');

const unified = require("unified");
const parse = require("rehype-parse");
const toMdast = require("hast-util-to-mdast");
const stringify = require("remark-stringify");

const keys = Object.keys(itemsReference);
const { JSDOM } = jsdom;

const isRelativeLink = (link) => !link.startsWith("http");

const serializeDOM = (dom) =>
  pretty(
    dom.window.document.body.innerHTML
    // .replace(/^<html><head><\/head><body>/, "")
    // .replace(/<\/body><\/html>$/, "")
    // .replace(/<br>/g, "<br/>")
    // .replace(/<wbr>/g, "<wbr/>")
  );

const transformLinks = (dom, crate) => {
  Array.from(dom.window.document.querySelectorAll("a")).forEach((anchor) => {
    if (isRelativeLink(anchor.href)) {
      // TO REFINE
      anchor.href = `/docs/api/rust/${crate}/` + anchor.href;
    }
  });
};

const removeRustdocTools = (dom) => {
  const selectors = ["#render-detail", "a.srclink", "a.anchor"];
  selectors.forEach((selector) => {
    Array.from(
      dom.window.document.querySelectorAll(selector)
    ).forEach((element) => element.parentNode.removeChild(element));
  });
};

const transformCodeBlocks = (dom) => {
  Array.from(dom.window.document.querySelectorAll("pre")).forEach((element) => {
    element.prepend(dom.window.document.createTextNode("```rs\r"));
    element.append(dom.window.document.createTextNode("\r```"));
  });
};

const transform = async (contents, crate) => {
  const transformedContents = clone(contents);
  const promises = keys.map(async (key) => {
    if (key === "module") {
      for (const path in transformedContents.module) {
        transformedContents.module[path] = await transform(
          transformedContents.module[path],
          crate
        );
      }
      return;
    }
    const res = transformedContents[key].map((item) => {
      const dom = new JSDOM(item.content);
      removeRustdocTools(dom);
      transformCodeBlocks(dom);
      transformLinks(dom, crate);

      const serialized = serializeDOM(dom);

      const hast = unified().use(parse).parse(serialized);

      const mdast = toMdast(hast);

      let doc = unified().use(stringify).stringify(mdast);

      doc
        .match(/ *```rs[\s\S]*```/g)
        .map((codeblock) => [codeblock, codeblock.replace(/^ {4}/gm, "")])
        .forEach(([original, replacement]) => {
          doc = doc.replace(original, replacement);
        });

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
