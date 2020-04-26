import Ajv from "ajv";
import fs from "fs";
import yaml from "js-yaml";
import { Blueprint } from "./blueprint";

// load schema on import
const schemaJSON = yaml.safeLoad(
    fs.readFileSync(__dirname + "/schema.yaml", "utf8")
);
const ajv = new Ajv();
const validate = ajv.compile(schemaJSON);

function validateBlueprint(data: Object) {
    const valid = validate(data);
    if (!valid) {
        const errs = validate.errors?.map((err) => err.message);
        throw new Error(errs?.join("\n"));
    }
}

function loadAllBlueprints(): Map<string, Blueprint> {
    const files = fs.readdirSync(__dirname + "/..");
    const blueprintMap = new Map<string, Blueprint>();
    for (let filePath of files) {
        if (!filePath.endsWith(".yaml")) {
            continue;
        }
        const blueprint = loadBlueprint(__dirname + "/../" + filePath);
        blueprintMap.set(filePath.replace(".yaml", ""), blueprint);
    }
    return blueprintMap;
}

function normaliseLocalpartToCompleteUserID(
    localpart: string,
    hsName: string
): string {
    // if they did it as @foo:bar make sure :bar is the name of the HS
    if (localpart.includes(":")) {
        if (localpart.endsWith(`:${hsName}`)) {
            return localpart;
        }
        throw new Error(
            `HS '${hsName}' User '${localpart}' must end with ':${hsName}' or have no domain`
        );
    }
    if (!localpart.includes(":")) {
        localpart += `:${hsName}`;
    }
    return localpart;
}

// We allow user IDs of the form '@alice' or '@alice:hsname' but we want a standard format in code, the long form.
function resolveUserIds(blueprint: Blueprint) {
    blueprint.homeservers?.forEach((hs) => {
        hs.users?.forEach((user) => {
            if (user.localpart[0] !== "@") {
                throw new Error(
                    `HS ${hs.name} User ${user.localpart} must start with '@'`
                );
            }
            if (user.localpart.includes(":")) {
                throw new Error(
                    `HS ${hs.name} User ${user.localpart} must not contain a domain`
                );
            }
            user.localpart = user.localpart.replace("@", "");
        });
        hs.rooms?.forEach((room) => {
            room.creator = normaliseLocalpartToCompleteUserID(
                room.creator,
                hs.name
            );
            room.events?.forEach((event) => {
                event.sender = normaliseLocalpartToCompleteUserID(
                    event.sender,
                    hs.name
                );
                if (event.type == "m.room.member" && event.state_key) {
                    event.state_key = normaliseLocalpartToCompleteUserID(
                        event.state_key,
                        hs.name
                    );
                }
            });
        });
    });
}

function loadBlueprint(blueprintPath: string): Object {
    console.log("loading blueprint: ", blueprintPath);
    const doc = yaml.safeLoad(fs.readFileSync(blueprintPath, "utf8"));
    validateBlueprint(doc);
    resolveUserIds(doc);
    return doc;
}

export default loadAllBlueprints;
