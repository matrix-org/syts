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

const setupDocker = async function () {
    console.log("Loading and building all blueprints...");
    const blueprints = loadBlueprints();
    const builder = new DockerBuilder(
        process.env["SYTS_BASE_HS_IMAGE"],
        process.env["SYTS_BASE_HS_IMAGE_ARGS"]?.split(" "),
        process.env["SYTS_DOCKER_SOCK"]
    );
    await builder.constructBlueprints(blueprints);
};

const teardownDocker = async function () {
    // TODO delete running containers
    // TODO delete created images
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
