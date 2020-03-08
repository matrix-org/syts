// This file gets executed as a globalSetup hook when Jest runs. See jest.config.js
/*

globalSetup                                       +---------------------+
                                                  |              Docker |
 +------------+          +---------+    runs      |  +--------+         |
 | Blueprints | -------> | Builder | -----------> |  | Images |         |
 +------------+          +---------+   commits    |  +--------+         |
                                                  |                     |
                                                  |                     |
--------------------------------------------------------------------------------- 
test process                                      |                     |
                                                  |                     |
 +-------+                +----------+            |  +------------+     |
 | Tests | -------------> | Deployer | ---------> |  | Containers |     |
 +-------+                +----------+   runs     |  +------------+     |
                                                  +---------------------+

*/

import DockerBuilder from "./builder/docker";
import loadBlueprints from "./blueprints/loader/blueprint-loader";
import * as Result from "./result";

// TODO: Buiild all blueprints and commit images for them.

module.exports = async function() {
    console.log("Loading and building all blueprints...");
    const blueprints = loadBlueprints();
    if (Result.isError(blueprints)) {
        throw new Error(blueprints.message);
    }
    const builder = new DockerBuilder(
        process.env["SYTS_BASE_HS_IMAGE"],
        process.env["SYTS_DOCKER_SOCK"]
    );
    await builder.constructBlueprints(blueprints);
};
