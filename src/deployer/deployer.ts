export class Deployer {
    constructor() {}

    async deploy(blueprintName: string): Promise<Deployment> {
        // TODO: find deployment in "docker image ls" then run it.
        const d = new Deployment(blueprintName);
        d.setHomeserver({
            name: "hs1",
            url: "http://localhost:8008",
            image: "",
        });
        return d;
    }

    async destroy(deployment: Deployment) {}
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

    image(hsName: string): string {
        const info = this.hs.get(hsName);
        if (!info) {
            throw new Error(`No homeserver by the name '${hsName}' exists.`);
        }
        return info.image;
    }

    setHomeserver(hsInfo: HSInfo) {
        this.hs.set(hsInfo.name, hsInfo);
    }
}

export type HSInfo = {
    name: string;
    url: string;
    image: string;
};
