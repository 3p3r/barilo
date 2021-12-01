const fs = require("fs");
const path = require("path");
const files = fs.readdirSync(path.resolve(__dirname, "factories"));
const stepFactories = files.reduce((exp, file) => {
  exp = { ...exp, ...require(`./factories/${file}`) };
  return exp;
}, {});
module.exports = stepFactories;
