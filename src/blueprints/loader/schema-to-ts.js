const compile = require("json-schema-to-typescript");
const fs = require("fs");
const yaml = require("js-yaml");

const schemaJSON = yaml.safeLoad(
    fs.readFileSync(__dirname + "/schema.yaml", "utf8")
);

compile.compile(schemaJSON, "Blueprint").then(ts =>
    fs.writeFileSync(__dirname + "/blueprint.d.ts", ts)
);
