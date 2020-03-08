import { Blueprint, Homeserver } from "../blueprints/loader/blueprint";
import Docker from "dockerode";
import {
    Instruction,
    calculateInstructions,
} from "../blueprints/loader/instructions";

/**
 * DockerBuilder knows how to build blueprints into images.
 */
class DockerBuilder {
    public baseImage: string;
    public dockerSock: string;

    constructor(baseImage: string | undefined, dockerSock: string | undefined) {
        // Honour the env vars used by Docker CLI: https://docs.docker.com/engine/reference/commandline/cli/#environment-variables
        this.dockerSock =
            dockerSock || process.env["DOCKER_HOST"] || "/var/run/docker.sock";
        if (!baseImage) {
            throw new Error(
                "DockerBuilder required a base image: set SYTS_BASE_HS_IMAGE"
            );
        }
        this.baseImage = baseImage;
    }

    /**
     * Build the given blueprints for use later.
     */
    async constructBlueprints(blueprints: Map<string, Blueprint>) {
        // build all blueprints concurrently
        let promises: Array<Promise<Boolean>> = [];
        blueprints.forEach((blueprint, name) => {
            promises.push(this._construct(name, blueprint));
        });

        await Promise.all(promises);
    }

    async _construct(
        blueprintName: string,
        blueprint: Blueprint
    ): Promise<Boolean> {
        if (!blueprint.homeservers) {
            throw new Error(
                `Blueprint with name '${blueprintName}' is missing homeservers`
            );
        }
        console.log(`Blueprint: ${blueprintName}`);
        let promises: Array<Promise<Boolean>> = [];
        for (let hs of blueprint.homeservers) {
            promises.push(this._constructHomeserver(blueprintName, hs));
        }
        try {
            await promises;
        } catch (err) {
            console.error("Failed to deploy blueprint: ", err);
        }
        return true; // constructed OK!
    }

    async _constructHomeserver(
        blueprintName: string,
        hs: Homeserver
    ): Promise<Boolean> {
        console.log(`    constructing ${hs.name}...`);

        const contextStr = `${blueprintName}.${hs.name}`;
        const instructions = calculateInstructions(hs);
        // run the base image and execute the blueprint
        const imageId = await this._runInstructionsAndCommit(
            contextStr,
            instructions
        );
        console.log(`${contextStr} => ${imageId}`);
        return true;
    }

    async _runInstructionsAndCommit(
        contextStr: string,
        instructions: Array<Instruction>
    ): Promise<string> {
        // TODO:
        /*
        const docker = new Docker({ socketPath: this.dockerSock });
        // spin up the base image
        const data = await docker.run(this.baseImage, [], process.stdout, {
            name: "syts_" + contextStr,
            HostConfig: { AutoRemove: true, NetworkMode: "bridge" },
        });
        const output = data[0];
        const container = data[1];
        console.log(output.StatusCode);
        const containerData = await container.inspect();
        console.log(containerData);
        */

        // issue CS API commands from the instructions
        // commit the image and return the image ID.
        return "foo";
    }
}

export default DockerBuilder;
