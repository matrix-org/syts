import { Blueprint, Homeserver } from "../blueprints/loader/blueprint";
import Docker from "dockerode";
import { InstructionRunner } from "../blueprints/loader/instructions";
import Axios from "axios";

/**
 * DockerBuilder knows how to build blueprints into images.
 */
class DockerBuilder {
    public baseImage: string;
    public dockerSock: string;
    public imageCmd: string[];
    public csapiPort: number;
    public federationPort: number;

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
        // the ports that the base image will expose. We will handle mapping this to host ports.
        this.csapiPort = 8008; // allow images to change this
        this.federationPort = 8448; // allow images to change this
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
        const docker = new Docker({ socketPath: this.dockerSock });
        const server = await this._deployBaseImage(docker, contextStr);
        try {
            const runner = new InstructionRunner(hs, contextStr);
            await runner.run(server.baseUrl);

            const imageId = await this._commitImage(
                server.container,
                contextStr
            );
            console.log(`${contextStr} => ${imageId}`);
        } catch (err) {
            console.error(`${contextStr}: failed to run instructions: ${err}`);
        } finally {
            // cleanup
            await server.container.kill();
        }
        return true;
    }

    // run the base image and return the base URL to hit for instructions
    async _deployBaseImage(
        docker: Docker,
        contextStr: string
    ): Promise<{ baseUrl: string; container: Docker.Container }> {
        // spin up the base image
        const container = await docker.createContainer({
            Image: this.baseImage,
            Cmd: this.imageCmd,
            name: "syts_" + contextStr,
            HostConfig: {
                PublishAllPorts: true,
            },
        });
        await container.start();
        const inspect = await container.inspect();
        const hostPortInfo =
            inspect.NetworkSettings.Ports[`${this.csapiPort}/tcp`];
        if (!hostPortInfo) {
            throw new Error(
                `${contextStr}: image ${this.baseImage} does not expose port ${
                    this.csapiPort
                }/tcp - exposed: ${JSON.stringify(
                    inspect.NetworkSettings.Ports
                )}`
            );
        }
        const baseUrl = `http://localhost:${hostPortInfo[0].HostPort}`;
        // hit /versions to check it is up
        let lastErr = null;
        for (let i = 0; i < 20; i++) {
            try {
                const res = await Axios.get(
                    baseUrl + "/_matrix/client/versions"
                );
                if (res.status == 200) {
                    lastErr = null;
                    console.log(`${contextStr}: ${baseUrl} OK!`);
                    break;
                }
                lastErr = `GET ${baseUrl} => HTTP ${res.status}`;
                await sleep(50);
            } catch (err) {
                await sleep(50);
            }
        }
        if (lastErr) {
            throw new Error(
                `${contextStr}: failed to check server is up. ${lastErr}`
            );
        }

        return {
            baseUrl: baseUrl,
            container: container,
        };
    }

    // Resolves to a new image ID
    async _commitImage(
        container: Docker.Container,
        contextStr: string
    ): Promise<string> {
        const r = await container.commit({
            author: "SyTS",
            pause: true,
            repo: "syts",
            tag: contextStr,
        });
        const imageId: string = r["Id"];
        return imageId.replace("sha256:", "");
    }
}

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export default DockerBuilder;
