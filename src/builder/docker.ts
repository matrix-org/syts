import { Blueprint, Homeserver } from "../blueprints/loader/blueprint";
import Docker from "dockerode";
import { InstructionRunner } from "../blueprints/loader/instructions";

/**
 * DockerBuilder knows how to build blueprints into images.
 */
class DockerBuilder {
    public baseImage: string;
    public dockerSock: string;
    public imageCmd: string[];
    public portStartRange: number;

    constructor(
        baseImage: string | undefined,
        imageCmd: string[] | undefined,
        dockerSock: string | undefined
    ) {
        // Honour the env vars used by Docker CLI: https://docs.docker.com/engine/reference/commandline/cli/#environment-variables
        this.dockerSock =
            dockerSock || process.env["DOCKER_HOST"] || "/var/run/docker.sock";
        if (!baseImage) {
            throw new Error(
                "DockerBuilder required a base image: set SYTS_BASE_HS_IMAGE"
            );
        }
        this.baseImage = baseImage;
        this.portStartRange = 5475;
        this.imageCmd = [];
        if (imageCmd) {
            this.imageCmd = imageCmd;
        }
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
        if (blueprintName == "clean_hs") {
            return true;
        }
        let promises: Array<Promise<Boolean>> = [];
        for (let hs of blueprint.homeservers) {
            promises.push(this._constructHomeserver(blueprintName, hs));
        }
        await promises;
        return true; // constructed OK!
    }

    async _constructHomeserver(
        blueprintName: string,
        hs: Homeserver
    ): Promise<Boolean> {
        const contextStr = `${blueprintName}.${hs.name}`;
        console.log(`Building ${contextStr}...`);

        const baseUrl = await this._deployBaseImage(contextStr);
        const runner = new InstructionRunner(hs);
        runner.run(baseUrl);
        const imageId = await this._commitImage(contextStr);
        console.log(`${contextStr} => ${imageId}`);
        return true;
    }

    // run the base image and return the base URL to hit for instructions
    async _deployBaseImage(contextStr: string): Promise<string> {
        const docker = new Docker({ socketPath: this.dockerSock });
        // spin up the base image
        const container = await docker.createContainer({
            Image: this.baseImage,
            Cmd: this.imageCmd,
            ExposedPorts: { [this.portStartRange]: {} },
            name: "syts_" + contextStr,
        });
        this.portStartRange++;
        const data = await container.start({});
        console.log(data);
        return container.id;
    }

    async _commitImage(contextStr: string): Promise<string> {
        return "11223344";
    }
}

export default DockerBuilder;
