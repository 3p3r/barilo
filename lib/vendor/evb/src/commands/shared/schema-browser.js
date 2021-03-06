const inputUtil = require("./input-util");
const YAML = require("json-to-pretty-yaml");
const AWS = require("aws-sdk");
const log = require("debug")("barilo:schemaBrowser");

function isObject(item) {
  return item && typeof item === "object" && !Array.isArray(item);
}

function deepMerge(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
}

function outputPattern(output, format) {
  log("Generated output:");
  if (!format || format === "json") {
    log(JSON.stringify(output, null, 2));
  } else {
    log(YAML.stringify(output, null, 2));
  }
}

async function* ListSchemas(schemas, params) {
  let token;
  do {
    const response = await schemas
      .listSchemas({
        ...params,
        NextToken: token,
      })
      .promise();

    yield response.Schemas;

    ({ NextToken: token } = response);
  } while (token);
}

async function getSchema(schemas) {
  const { registry, schemaName, sourceName } = await getSchemaName(schemas);
  const describeSchemaResponse = await schemas
    .describeSchema({ RegistryName: registry.id, SchemaName: schemaName })
    .promise();
  const schema = JSON.parse(describeSchemaResponse.Content);
  return { sourceName, schema };
}

async function getSchemaName(schemas) {
  const registry = await inputUtil.getRegistry(schemas);
  const schemaList = [];
  for await (schemaItem of ListSchemas(schemas, {
    RegistryName: registry.id,
  })) {
    schemaList.push(...schemaItem);
  }
  const sourceName = await inputUtil.getSourceName(schemaList);
  const detailTypeName = await inputUtil.getDetailTypeName(
    schemaList,
    sourceName
  );
  const schemaName = `${sourceName}@${detailTypeName}`.replace(/\//g, "-");
  return { registry, schemaName, sourceName };
}

function findCurrent(path, schema) {
  const pathArray = path.split("/");
  pathArray.shift(); // Remove leading #
  let current = schema;
  for (var node of pathArray) {
    current = current[node];
  }
  return current;
}

module.exports = {
  deepMerge,
  getSchema,
  outputPattern,
  findCurrent,
  getSchemaName,
};
