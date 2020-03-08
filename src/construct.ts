import { Blueprint } from "./blueprints/loader/blueprint";

export class Construct {
    public blueprint: Blueprint;
    public hs: Map<string, HSInfo>;

    constructor(blueprint: Blueprint) {
        this.blueprint = blueprint;
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

export class HSInfo {
    public name: string;
    public url: string;
    public image: string;

    constructor(name: string) {
        this.name = name;
        this.url = "";
        this.image = "";
    }
}

export default Construct;
