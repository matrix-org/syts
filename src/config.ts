import loadBlueprints from "./blueprints/loader/blueprint-loader";
import { Blueprint } from "./blueprints/loader/blueprint";
import * as Result from "./result";

class Config {
    public HS1: string = "http://localhost:8008";
    public HS2: string = "http://localhost:8007";
    public HS3: string = "http://localhost:8006";

    public blueprints: Map<string, Blueprint>;

    constructor() {
        if (process.env.CS_API) {
            this.HS1 = process.env.CS_API;
        }
        const blueprints = loadBlueprints();
        if (Result.isError(blueprints)) {
            throw new Error(blueprints.message);
        }
        this.blueprints = blueprints;
    }

    async load(blueprintName: string): Promise<Blueprint | undefined> {
        return Promise.resolve(this.blueprints.get(blueprintName));
    }
}

export default Config;
