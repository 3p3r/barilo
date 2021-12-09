const _ = require("lodash");
const storage = require("node-persist");
const inquirer = require("inquirer");
const timestring = require("timestring");
const { boolean } = require("boolean");

inquirer.registerPrompt(
  "autocomplete",
  require("inquirer-autocomplete-prompt")
);

const STORAGE_KEY = "questionnaire";
/** @param {inquirer.Question} opts */
async function prompt(opts) {
  const qa = (await storage.getItem(STORAGE_KEY)) || {};
  const question = `Q${Object.keys(qa).length + 1}: ${opts.message}`;
  const defaultOverride = _.get(qa[question], "id", opts.default);
  const answer = await inquirer.prompt({ ...opts, default: defaultOverride });
  qa[question] = answer;
  await storage.setItem(STORAGE_KEY, qa);
  return answer;
}

const BACK = "↩ back";
const UNDO = "⎌ undo";
const DONE = "✔ done";
const backNavigation = [BACK, new inquirer.Separator("-------------")];
const doneNavigation = [DONE, UNDO, new inquirer.Separator("-------------")];
const numericOperators = [">", "<", "=", ">=", "<=", "!=", "range"];
const filterRules = [
  "equals",
  "prefix",
  "anything-but",
  "numeric",
  "exists",
  "null",
];

async function text(message, def) {
  const response = await prompt({
    name: "id",
    type: "input",
    message: message,
    default: def,
  });
  return response.id;
}

async function editor(message, def) {
  const response = await prompt({
    name: "id",
    type: "editor",
    message: message,
    default: def,
  });
  return response.id;
}

async function getStringValue(fieldName, type) {
  const rules = JSON.parse(JSON.stringify(filterRules));
  const rule = await prompt({
    name: "id",
    type: "list",
    message: `Enter rule for ${fieldName} matching`,
    choices: [...rules],
  });

  let val = undefined;
  if (rule.id !== "exists" && rule.id !== "numeric") {
    const value = await prompt({
      name: "id",
      type: "input",
      message: `Enter value for ${fieldName}. Comma separate for array`,
    });
    val = value.id.includes(",")
      ? value.id.split(",").map((p) => p.trim())
      : value.id;
  } else if (rule.id === "exists") {
    val = true;
  } else if (rule.id === "numeric") {
    const operator = await prompt({
      name: "id",
      type: "list",
      message: `Select operator`,
      choices: numericOperators,
    });
    if (operator.id === "range") {
      const lower = await prompt({
        name: "id",
        type: "input",
        message: `Lower bound for ${fieldName}`,
      });
      const upper = await prompt({
        name: "id",
        type: "input",
        message: `Upper bound for ${fieldName}`,
      });
      val = [">=", parseFloat(lower.id), "<", parseFloat(upper.id)];
    } else {
      const value = await prompt({
        name: "id",
        type: "input",
        message: `Enter value for ${fieldName}`,
      });

      val = [operator.id, parseFloat(value.id)];
    }
  }
  let returnObj = {};

  let ruleObj = rule.id === "equals" ? val : undefined;
  if (!ruleObj) {
    ruleObj = {};
    ruleObj[rule.id] = val;
  }
  if (!Array.isArray(ruleObj)) {
    returnObj[fieldName] = [];
    returnObj[fieldName].push(ruleObj);
  } else {
    returnObj[fieldName] = ruleObj;
  }

  return returnObj;
}

async function getProperty(currentObject, objectArray) {
  let fieldList = Object.keys(currentObject.properties);
  const choices = [
    ...(objectArray.length ? backNavigation : doneNavigation),
    ...fieldList,
  ];
  const property = await prompt({
    name: "id",
    type: "autocomplete",
    message: `Add ${
      objectArray[objectArray.length - 1] ||
      currentObject["x-amazon-events-detail-type"]
    } item`,
    choices: choices,
    source: sourceAutocomplete(choices),
  });
  objectArray.push(property.id);
  const chosenProp = currentObject.properties[property.id];

  return { property, chosenProp };
}

async function getDetailTypeName(schemas, sourceName) {
  const detailTypes = schemas
    .filter((p) => p.SchemaName.startsWith(`${sourceName}@`))
    .map((p) => p.SchemaName.split("@")[1]);
  const detailType = await prompt({
    name: "id",
    type: "autocomplete",
    message: "Select detail-type",
    choices: detailTypes,
    source: sourceAutocomplete(detailTypes),
  });

  const detailTypeName = detailType.id;
  return detailTypeName;
}

async function getSourceName(schemas) {
  const sources = [...new Set(schemas.map((p) => p.SchemaName.split("@")[0]))];
  const source = await prompt({
    name: "id",
    type: "autocomplete",
    message: "Select source",
    choices: sources,
    source: sourceAutocomplete(sources),
  });
  const sourceName = source.id;
  return sourceName;
}

function sourceAutocomplete(sources) {
  return function (answersYet, input) {
    if (!input) {
      return sources;
    }

    const split = input.split(" ");
    return sources.filter(
      (p) =>
        !p ||
        split.filter(
          (f) =>
            (typeof p === "string" &&
              p.toLowerCase().includes(f.toLowerCase())) ||
            (p.name && p.name.toLowerCase().includes(f.toLowerCase()))
        ).length === split.length
    );
  };
}

async function getRegistry(schemas) {
  const registriesResponse = await schemas.listRegistries().promise();
  const registries = [
    ...new Set(registriesResponse.Registries.map((p) => p.RegistryName)),
  ];
  const registry = await prompt({
    name: "id",
    type: "list",
    message: "Select registry",
    choices: registries,
  });
  return registry;
}

async function selectFrom(
  list,
  message = "Please select",
  skipBack = true,
  type = "autocomplete"
) {
  const choices = [!skipBack ? BACK : null, ...list].filter((p) => p);
  const answer = await prompt({
    name: "id",
    type: type,
    message: message,
    choices: choices,
    source: sourceAutocomplete(choices),
  });
  return answer.id;
}

async function selectConfirm(message) {
  const result = boolean(await selectFrom([], message, true, "confirm"));
  return result;
}

async function getDuration(message) {
  const read = await text(message, "15s");
  const time = timestring(read);
  return time;
}

async function multiSelectFrom(list, message, skipBack) {
  const answer = await prompt({
    name: "id",
    type: "checkbox",
    message: message || "Please select",
    choices: [!skipBack ? BACK : null, ...list].filter((p) => p),
  });
  return answer.id;
}

async function getPropertyValue(chosenProp, property) {
  let answer = undefined;
  switch (chosenProp.type) {
    case "string":
      answer = await getStringValue(property.id, chosenProp.type);
      break;
    // placeholder for dateselector, etc
    default:
      answer = await getStringValue(property.id, chosenProp.type);
  }
  return answer;
}

module.exports = {
  getRegistry,
  getSourceName,
  getDetailTypeName,
  selectFrom,
  selectConfirm,
  multiSelectFrom,
  getDuration,
  getProperty,
  getPropertyValue,
  editor,
  text,
  BACK,
  DONE,
  UNDO,
};
