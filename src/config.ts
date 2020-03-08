import loadBlueprints from "./blueprints/loader/blueprint-loader";
import { Blueprint } from "./blueprints/loader/blueprint";
import { HSInfo, Construct } from "./construct";
import * as Result from "./result";

class Config {
    public blueprints: Map<string, Blueprint>;

    constructor() {
        const blueprints = loadBlueprints();
        if (Result.isError(blueprints)) {
            throw new Error(blueprints.message);
        }
        this.blueprints = blueprints;
    }

    async construct(blueprintName: string): Promise<Construct> {
        const blueprint = this.blueprints.get(blueprintName);
        if (!blueprint) {
            throw new Error(`No blueprint with name '${blueprintName}'`);
        }
        const construct = new Construct(blueprint);
        blueprint.homeservers?.forEach(hs => {
            const info = new HSInfo(hs.name);
            const envVal = process.env[hs.name.toUpperCase() + "_URL"];
            if (envVal) {
                info.url = envVal;
            } else {
                info.url = "http://localhost:8008";
            }
            construct.setHomeserver(info);
        });

        return Promise.resolve(construct);
    }

    async destroy(construct: Construct) {}
}

export default Config;
