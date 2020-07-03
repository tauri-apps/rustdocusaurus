module.exports =
/******/ (function(modules, runtime) { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete installedModules[moduleId];
/******/ 		}
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	__webpack_require__.ab = __dirname + "/";
/******/
/******/ 	// the startup function
/******/ 	function startup() {
/******/ 		// Load entry module and return exports
/******/ 		return __webpack_require__(104);
/******/ 	};
/******/
/******/ 	// run startup
/******/ 	return startup();
/******/ })
/************************************************************************/
/******/ ({

/***/ 87:
/***/ (function(module) {

module.exports = require("os");

/***/ }),

/***/ 104:
/***/ (function(__unusedmodule, __unusedexports, __webpack_require__) {

const core = __webpack_require__(470);
const { transformDocs } = __webpack_require__(908);
const generateSidebar = __webpack_require__(762);
const fs = __webpack_require__(747).promises;

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


/***/ }),

/***/ 147:
/***/ (function(module, __unusedexports, __webpack_require__) {

const jsdom = __webpack_require__(338);
const TurndownService = __webpack_require__(843);
const { clone, itemsReference } = __webpack_require__(225);
const pretty = __webpack_require__(317);

// const Entities = require('html-entities').AllHtmlEntities;

// const entities = new Entities();

// const HTMLParser = require('node-html-parser');

const unified = __webpack_require__(718);
const parse = __webpack_require__(582);
const toMdast = __webpack_require__(708);
const stringify = __webpack_require__(793);

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
  Array.from(dom.window.document.querySelectorAll("pre")).forEach((element) =>
    element.parentNode.removeChild(element)
  );
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
      // transformCodeBlocks(dom);
      transformLinks(dom, crate);

      const serialized = serializeDOM(dom);

      const hast = unified().use(parse).parse(serialized);

      const mdast = toMdast(hast);

      const doc = unified().use(stringify).stringify(mdast);

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


/***/ }),

/***/ 225:
/***/ (function(module) {

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


/***/ }),

/***/ 310:
/***/ (function(module) {

module.exports = eval("require")("deepmerge");


/***/ }),

/***/ 317:
/***/ (function(module) {

module.exports = eval("require")("pretty");


/***/ }),

/***/ 338:
/***/ (function(module) {

module.exports = eval("require")("jsdom");


/***/ }),

/***/ 340:
/***/ (function(module, __unusedexports, __webpack_require__) {

const fs = __webpack_require__(747).promises;
const jsdom = __webpack_require__(338);
const { clone, itemsReference } = __webpack_require__(225);

const keys = Object.keys(itemsReference);

const { JSDOM } = jsdom;

const extract = async (docs) => {
  const extractedContent = clone(docs);
  const promises = keys.map(async (key) => {
    if (key === "module") {
      for (const path in extractedContent.module) {
        extractedContent.module[path] = await extract(
          extractedContent.module[path]
        );
      }
      return;
    }
    const res = extractedContent[key].map(async (path) => {
      const html = await fs.readFile(path, "utf-8");

      return {
        path,
        content: new JSDOM(html),
      };
    });

    extractedContent[key] = (await Promise.all(res))
      .filter((item) => item.content.window.document.getElementById("main"))
      .map(({ path, content }) => ({
        path,
        content: content.window.document.getElementById("main").innerHTML,
      }));
  });
  await Promise.all(promises);
  return extractedContent;
};

module.exports = extract;


/***/ }),

/***/ 431:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";

var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const os = __importStar(__webpack_require__(87));
/**
 * Commands
 *
 * Command Format:
 *   ::name key=value,key=value::message
 *
 * Examples:
 *   ::warning::This is the message
 *   ::set-env name=MY_VAR::some value
 */
function issueCommand(command, properties, message) {
    const cmd = new Command(command, properties, message);
    process.stdout.write(cmd.toString() + os.EOL);
}
exports.issueCommand = issueCommand;
function issue(name, message = '') {
    issueCommand(name, {}, message);
}
exports.issue = issue;
const CMD_STRING = '::';
class Command {
    constructor(command, properties, message) {
        if (!command) {
            command = 'missing.command';
        }
        this.command = command;
        this.properties = properties;
        this.message = message;
    }
    toString() {
        let cmdStr = CMD_STRING + this.command;
        if (this.properties && Object.keys(this.properties).length > 0) {
            cmdStr += ' ';
            let first = true;
            for (const key in this.properties) {
                if (this.properties.hasOwnProperty(key)) {
                    const val = this.properties[key];
                    if (val) {
                        if (first) {
                            first = false;
                        }
                        else {
                            cmdStr += ',';
                        }
                        cmdStr += `${key}=${escapeProperty(val)}`;
                    }
                }
            }
        }
        cmdStr += `${CMD_STRING}${escapeData(this.message)}`;
        return cmdStr;
    }
}
/**
 * Sanitizes an input into a string so it can be passed into issueCommand safely
 * @param input input to sanitize into a string
 */
function toCommandValue(input) {
    if (input === null || input === undefined) {
        return '';
    }
    else if (typeof input === 'string' || input instanceof String) {
        return input;
    }
    return JSON.stringify(input);
}
exports.toCommandValue = toCommandValue;
function escapeData(s) {
    return toCommandValue(s)
        .replace(/%/g, '%25')
        .replace(/\r/g, '%0D')
        .replace(/\n/g, '%0A');
}
function escapeProperty(s) {
    return toCommandValue(s)
        .replace(/%/g, '%25')
        .replace(/\r/g, '%0D')
        .replace(/\n/g, '%0A')
        .replace(/:/g, '%3A')
        .replace(/,/g, '%2C');
}
//# sourceMappingURL=command.js.map

/***/ }),

/***/ 470:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = __webpack_require__(431);
const os = __importStar(__webpack_require__(87));
const path = __importStar(__webpack_require__(622));
/**
 * The code to exit an action
 */
var ExitCode;
(function (ExitCode) {
    /**
     * A code indicating that the action was successful
     */
    ExitCode[ExitCode["Success"] = 0] = "Success";
    /**
     * A code indicating that the action was a failure
     */
    ExitCode[ExitCode["Failure"] = 1] = "Failure";
})(ExitCode = exports.ExitCode || (exports.ExitCode = {}));
//-----------------------------------------------------------------------
// Variables
//-----------------------------------------------------------------------
/**
 * Sets env variable for this action and future actions in the job
 * @param name the name of the variable to set
 * @param val the value of the variable. Non-string values will be converted to a string via JSON.stringify
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function exportVariable(name, val) {
    const convertedVal = command_1.toCommandValue(val);
    process.env[name] = convertedVal;
    command_1.issueCommand('set-env', { name }, convertedVal);
}
exports.exportVariable = exportVariable;
/**
 * Registers a secret which will get masked from logs
 * @param secret value of the secret
 */
function setSecret(secret) {
    command_1.issueCommand('add-mask', {}, secret);
}
exports.setSecret = setSecret;
/**
 * Prepends inputPath to the PATH (for this action and future actions)
 * @param inputPath
 */
function addPath(inputPath) {
    command_1.issueCommand('add-path', {}, inputPath);
    process.env['PATH'] = `${inputPath}${path.delimiter}${process.env['PATH']}`;
}
exports.addPath = addPath;
/**
 * Gets the value of an input.  The value is also trimmed.
 *
 * @param     name     name of the input to get
 * @param     options  optional. See InputOptions.
 * @returns   string
 */
function getInput(name, options) {
    const val = process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] || '';
    if (options && options.required && !val) {
        throw new Error(`Input required and not supplied: ${name}`);
    }
    return val.trim();
}
exports.getInput = getInput;
/**
 * Sets the value of an output.
 *
 * @param     name     name of the output to set
 * @param     value    value to store. Non-string values will be converted to a string via JSON.stringify
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setOutput(name, value) {
    command_1.issueCommand('set-output', { name }, value);
}
exports.setOutput = setOutput;
/**
 * Enables or disables the echoing of commands into stdout for the rest of the step.
 * Echoing is disabled by default if ACTIONS_STEP_DEBUG is not set.
 *
 */
function setCommandEcho(enabled) {
    command_1.issue('echo', enabled ? 'on' : 'off');
}
exports.setCommandEcho = setCommandEcho;
//-----------------------------------------------------------------------
// Results
//-----------------------------------------------------------------------
/**
 * Sets the action status to failed.
 * When the action exits it will be with an exit code of 1
 * @param message add error issue message
 */
function setFailed(message) {
    process.exitCode = ExitCode.Failure;
    error(message);
}
exports.setFailed = setFailed;
//-----------------------------------------------------------------------
// Logging Commands
//-----------------------------------------------------------------------
/**
 * Gets whether Actions Step Debug is on or not
 */
function isDebug() {
    return process.env['RUNNER_DEBUG'] === '1';
}
exports.isDebug = isDebug;
/**
 * Writes debug message to user log
 * @param message debug message
 */
function debug(message) {
    command_1.issueCommand('debug', {}, message);
}
exports.debug = debug;
/**
 * Adds an error issue
 * @param message error issue message. Errors will be converted to string via toString()
 */
function error(message) {
    command_1.issue('error', message instanceof Error ? message.toString() : message);
}
exports.error = error;
/**
 * Adds an warning issue
 * @param message warning issue message. Errors will be converted to string via toString()
 */
function warning(message) {
    command_1.issue('warning', message instanceof Error ? message.toString() : message);
}
exports.warning = warning;
/**
 * Writes info to log with console.log.
 * @param message info message
 */
function info(message) {
    process.stdout.write(message + os.EOL);
}
exports.info = info;
/**
 * Begin an output group.
 *
 * Output until the next `groupEnd` will be foldable in this group
 *
 * @param name The name of the output group
 */
function startGroup(name) {
    command_1.issue('group', name);
}
exports.startGroup = startGroup;
/**
 * End an output group.
 */
function endGroup() {
    command_1.issue('endgroup');
}
exports.endGroup = endGroup;
/**
 * Wrap an asynchronous function call in a group.
 *
 * Returns the same type as the function itself.
 *
 * @param name The name of the group
 * @param fn The function to wrap in the group
 */
function group(name, fn) {
    return __awaiter(this, void 0, void 0, function* () {
        startGroup(name);
        let result;
        try {
            result = yield fn();
        }
        finally {
            endGroup();
        }
        return result;
    });
}
exports.group = group;
//-----------------------------------------------------------------------
// Wrapper action state
//-----------------------------------------------------------------------
/**
 * Saves state for current action, the state can only be retrieved by this action's post job execution.
 *
 * @param     name     name of the state to store
 * @param     value    value to store. Non-string values will be converted to a string via JSON.stringify
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function saveState(name, value) {
    command_1.issueCommand('save-state', { name }, value);
}
exports.saveState = saveState;
/**
 * Gets the value of an state set by this action's main execution.
 *
 * @param     name     name of the state to get
 * @returns   string
 */
function getState(name) {
    return process.env[`STATE_${name}`] || '';
}
exports.getState = getState;
//# sourceMappingURL=core.js.map

/***/ }),

/***/ 582:
/***/ (function(module) {

module.exports = eval("require")("rehype-parse");


/***/ }),

/***/ 622:
/***/ (function(module) {

module.exports = require("path");

/***/ }),

/***/ 648:
/***/ (function(module, __unusedexports, __webpack_require__) {

const fs = __webpack_require__(747).promises;
const { itemsReference } = __webpack_require__(225);
const keys = Object.keys(itemsReference);

const save = async (docs, originPath, targetPath) => {
  const promises = keys.map(async (key) => {
    if (key === "module") {
      for (const path in docs.module) {
        await save(docs.module[path], originPath, targetPath);
      }
      return;
    }
    const res = docs[key].map(async (item) => {
      const path = item.path
        .replace(originPath, targetPath)
        .replace(/.html$/, ".md");
      const title = path.split("/").pop().replace(".md", "");

      const content = `---
title: "${title}"
---

${item.content}
`;
      const s = path.split("/");
      s.pop();
      const targetDirectory = s.join("/");
      await fs.mkdir(targetDirectory, { recursive: true });
      return fs.writeFile(path, content);
    });
    await Promise.all(res);
    // extractedContent[key] = await Promise.all(res);
  });
  await Promise.all(promises);
};

module.exports = save;


/***/ }),

/***/ 708:
/***/ (function(module) {

module.exports = eval("require")("hast-util-to-mdast");


/***/ }),

/***/ 718:
/***/ (function(module) {

module.exports = eval("require")("unified");


/***/ }),

/***/ 747:
/***/ (function(module) {

module.exports = require("fs");

/***/ }),

/***/ 762:
/***/ (function(module, __unusedexports, __webpack_require__) {

const { itemsReference } = __webpack_require__(225);
const keys = Object.keys(itemsReference);

const generateSidebar = (contents, label, originPath) => {
  const out = {
    label,
    type: "category",
    items: [],
  };
  keys.forEach((key) => {
    if (key === "module") {
      for (const path in contents.module) {
        const moduleLabel = path.split("/").pop();
        out.items.push(generateSidebar(contents.module[path], moduleLabel, originPath));
      }
      return;
    }
    contents[key].forEach((item) => {
      out.items.push(
        item.path.replace(originPath, `api/rust/`).replace(".html", "")
      );
    });
  });
  return out;
};

module.exports = generateSidebar;


/***/ }),

/***/ 793:
/***/ (function(module) {

module.exports = eval("require")("remark-stringify");


/***/ }),

/***/ 843:
/***/ (function(module) {

module.exports = eval("require")("turndown");


/***/ }),

/***/ 895:
/***/ (function(module, __unusedexports, __webpack_require__) {

const fs = __webpack_require__(747).promises;
const merge = __webpack_require__(310);
const { itemsReference, clone } = __webpack_require__(225);

const isStorable = (node) =>
  !["all.html", "index.html", "sidebar-items.js"].includes(node);

const determineType = (node) => node.split(".").shift();

const explore = async (directory) => {
  const nodes = await fs.readdir(directory);
  const storedItems = nodes.map(async (node) => {
    const items = clone(itemsReference);
    const path = directory + "/" + node;
    const stats = await fs.lstat(path);

    if (stats.isDirectory()) {
      const subItems = await explore(path);
      items.module[path] = subItems;
    } else if (isStorable(node)) {
      items[determineType(node)].push(path);
    }
    return items;
  });
  const result = await Promise.all(storedItems);
  return merge.all(result);
};

module.exports = explore;


/***/ }),

/***/ 908:
/***/ (function(module, __unusedexports, __webpack_require__) {

const explore = __webpack_require__(895);
const extract = __webpack_require__(340);
const transform = __webpack_require__(147);
const save = __webpack_require__(648);

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


/***/ })

/******/ });