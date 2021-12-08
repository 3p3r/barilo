#!/usr/bin/env node
process.env.AWS_SDK_LOAD_CONFIG = 1;
process.env.EDITOR = "nano";

const { program } = require("commander");
const { version } = require("./package.json");

require("./lib/commands/guardrail");

program.version(version, "-v, --version", "output the current version");
program.parse(process.argv);

if (process.argv.length < 3) {
  program.help();
}
