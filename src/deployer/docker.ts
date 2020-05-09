import Axios from "axios";
import Docker from "dockerode";
import { stringify } from "querystring";

export class DockerDeployer {
    private docker: Docker;
    public namespace: string;
    private counter: number;
    constructor(namespace: string) {
        this.docker = new Docker();
        this.namespace = namespace;
        this.counter = 0;
    }

    async deploy(blueprintName: string): Promise<Deployment> {
        console.log(`deploying ${blueprintName}...`);
        // find deployment in "docker image ls" then run it.
        const imageInfos = await this.docker.listImages({
            filters: {
                label: [`syts_blueprint=${blueprintName}`],
            },
        });
        if (imageInfos.length === 0) {
            throw new Error(
                "No images have been built for blueprint: " + blueprintName
            );
        }
        const d = new Deployment(blueprintName);
        for (let i = 0; i < imageInfos.length; i++) {
            this.counter++;
            const contextStr = imageInfos[i].Labels["syts_context"];
            const hs = await this._runImage(
                imageInfos[i].Id,
                `syts_${this.namespace}_${contextStr}_${this.counter}`,
                contextStr,
                blueprintName,
                imageInfos[i].Labels["syts_hs_name"],
                8008 // TODO: configurable
            );
            console.log(`${contextStr} -> ${hs.url} (${hs.containerId})`);
            d.setHomeserver({
                name: imageInfos[i].Labels["syts_hs_name"],
                url: hs.url,
                containerId: hs.containerId,
            });
        }

        return d;
    }

    async destroy(deployment: Deployment) {
        const promises: Array<Promise<any>> = [];
        deployment.hs.forEach((val, key) => {
            const container = this.docker.getContainer(val.containerId);
            console.log(`Destroying ${val.name} (${val.url})`);
            promises.push(
                container.remove({
                    force: true,
                })
            );
        });
        await promises;
    }

    // TODO: code dupe with builder/docker.ts
    async _runImage(
        imageId: string,
        containerName: string,
        contextStr: string,
        blueprintName: string,
        hsName: string,
        csapiPort: number
    ): Promise<{ url: string; containerId: string }> {
        let container: Docker.Container;
        try {
            container = await this.docker.createContainer({
                Image: imageId,
                //Cmd: this.imageCmd,
                name: containerName,
                Labels: {
                    syts_context: contextStr,
                    syts_blueprint: blueprintName,
                    syts_hs_name: hsName,
                },
                HostConfig: {
                    PublishAllPorts: true,
                },
            });
        } catch (err) {
            console.error(
                `Failed to create container with image ID ${imageId} for ${contextStr}: ${err}`
            );
            throw err;
        }
        let inspect: Docker.ContainerInspectInfo;
        try {
            await container.start();
            inspect = await container.inspect();
        } catch (err) {
            console.error(`Failed to start container ${contextStr}: ${err}`);
            throw err;
        }
        const hostPortInfo = inspect.NetworkSettings.Ports[`${csapiPort}/tcp`];
        if (!hostPortInfo) {
            throw new Error(
                `${contextStr}: image ${imageId} does not expose port ${csapiPort}/tcp - exposed: ${JSON.stringify(
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
            url: baseUrl,
            containerId: container.id,
        };
    }
}

export class Deployment {
    public blueprintName: string;
    public hs: Map<string, HSInfo>; // hs_name => HSInfo

    constructor(blueprintName: string) {
        this.blueprintName = blueprintName;
        this.hs = new Map<string, HSInfo>();
    }

    url(hsName: string): string {
        const info = this.hs.get(hsName);
        if (!info) {
            throw new Error(`No homeserver by the name '${hsName}' exists.`);
        }
        return info.url;
    }

    containerId(hsName: string): string {
        const info = this.hs.get(hsName);
        if (!info) {
            throw new Error(`No homeserver by the name '${hsName}' exists.`);
        }
        return info.containerId;
    }

    setHomeserver(hsInfo: HSInfo) {
        this.hs.set(hsInfo.name, hsInfo);
    }
}

type HSInfo = {
    name: string;
    url: string;
    containerId: string;
};

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
