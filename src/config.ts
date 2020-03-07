import loadBlueprints from "./blueprints/loader/blueprint-loader";
import * as Result from "./result";

class Config {
    public HS1: string = "http://localhost:8008";
    public HS2: string = "http://localhost:8007";
    public HS3: string = "http://localhost:8006";

    constructor() {
        if (process.env.CS_API) {
            this.HS1 = process.env.CS_API;
        }
        const blueprints = loadBlueprints();
        if (Result.isError(blueprints)) {
            throw new Error(blueprints.message);
        }
        console.log("loaded blueprints, ", blueprints);

        blueprints.forEach(b => {
            console.log(JSON.stringify(b));
        });
    }
}

export default Config;
