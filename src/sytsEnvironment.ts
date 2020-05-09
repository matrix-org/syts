import NodeEnvironment from "jest-environment-node";
import DockerBuilder from "./builder/docker";
import loadBlueprints from "./blueprints/loader/blueprint-loader";

/*

This is the main entry point for SyTS. This file governs:
 - Loading blueprints.
 - Creating homeserver base containers.
 - Running blueprints on containers.
 - Committing the containers as new images with well-defined names $blueprintName:$hsName

Tests will then ask for a deployment of a blueprint by name which will deploy potentially
multiple servers (if testing Federation). Those servers can then be poked until the deployment
is destroyed.

setup (this file)                                 +---------------------+
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

let builder: DockerBuilder;
const setupDocker = async function () {
    console.log("[Global Setup] Loading and building all blueprints...");
    const blueprints = loadBlueprints();
    builder = new DockerBuilder(
        process.env["SYTS_BASE_HS_IMAGE"],
        process.env["SYTS_BASE_HS_IMAGE_ARGS"]?.split(" "),
        process.env["SYTS_DOCKER_SOCK"]
    );
    await builder.cleanup(); // in case we failed before
    await builder.constructBlueprints(blueprints);
    console.log("[Global Setup] complete!");
};

const teardownDocker = async function () {
    console.log("[Global Teardown] Cleaning up containers and images...");
    await builder.cleanup();
    console.log("[Global Teardown] complete!");
};

class SytsEnvironment extends NodeEnvironment {
    constructor(config: any) {
        super(config);
    }

    async setup() {
        await super.setup();
        await setupDocker();
    }

    async teardown() {
        await super.teardown();
        await teardownDocker();
    }
}

export default SytsEnvironment;
export { teardownDocker, setupDocker };
