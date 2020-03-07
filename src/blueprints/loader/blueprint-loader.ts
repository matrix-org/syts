import Ajv from "ajv";
import * as Result from "../../result";
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
        const errs = validate.errors?.map(err => err.message);
        throw new Error(errs?.join("\n"));
    }
}

function loadAllBlueprints(): Result.Type<Array<Blueprint>> {
    try {
        const files = fs.readdirSync(__dirname + "/..");
        return files
            .filter(filePath => {
                return filePath.endsWith(".yaml");
            })
            .map(blueprintPath => {
                return loadBlueprint(__dirname + "/../" + blueprintPath);
            });
    } catch (err) {
        return err;
    }
}

function sanityCheckUserLocalpart(localpart: string, hsName: string) {
    // if they did it as @foo:bar make sure :bar is the name of the HS
    if (localpart.includes(":")) {
        if (localpart.endsWith(`:${hsName}`)) {
            return;
        }
        throw new Error(
            `HS '${hsName}' User '${localpart}' must end with ':${hsName}' or have no domain`
        );
    }
}

// We allow user IDs of the form '@alice' or '@alice:hsname' but we want a standard format in code, the long form.
function resolveUserIds(blueprint: Blueprint) {
    blueprint.homeservers?.forEach(hs => {
        hs.users?.forEach(user => {
            sanityCheckUserLocalpart(user.localpart, hs.name);
            if (!user.localpart.includes(":")) {
                user.localpart += `:${hs.name}`;
            }
        });
        hs.rooms?.forEach(room => {
            room.events?.forEach(event => {
                sanityCheckUserLocalpart(event.sender, hs.name);
                if (!event.sender.includes(":")) {
                    event.sender += `:${hs.name}`;
                }
                if (event.type == "m.room.member" && event.state_key) {
                    sanityCheckUserLocalpart(event.state_key, hs.name);
                    if (!event.state_key.includes(":")) {
                        event.state_key += `:${hs.name}`;
                    }
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
