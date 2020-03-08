import loadBlueprints from "../blueprints/loader/blueprint-loader";
import { Blueprint, Homeserver } from "../blueprints/loader/blueprint";
import { HSInfo, Construct } from "../construct";
import * as Result from "../result";
import * as docker from "./docker";

class Builder {
    public blueprints: Map<string, Blueprint>;
    public baseImage: string;
    public dockerSock: string;
    private hsEnvUrlOverrides: Map<string, string>; // hs_name => URL

    private imageCache: Map<string, Array<HSInfo>>; // blueprint_name => HSInfo

    constructor() {
        const blueprints = loadBlueprints();
        if (Result.isError(blueprints)) {
            throw new Error(blueprints.message);
        }
        this.blueprints = blueprints;
        this.dockerSock = "/var/run/docker.sock";
        this.baseImage = process.env["SYTS_BASE_HS_IMAGE"] || "";
        this.hsEnvUrlOverrides = new Map<string, string>();
        this._setOverridesFromEnvironment();
        this.imageCache = new Map<string, Array<HSInfo>>();
    }

    _setOverridesFromEnvironment() {
        // Honour the env vars used by Docker CLI: https://docs.docker.com/engine/reference/commandline/cli/#environment-variables
        if (process.env["DOCKER_HOST"]) {
            this.dockerSock = process.env["DOCKER_HOST"];
        }
        Object.keys(process.env).forEach(key => {
            if (key.startsWith("SYTS_HS_URL_")) {
                this.hsEnvUrlOverrides.set(
                    key.substr("SYTS_HS_URL_".length),
                    process.env[key] || ""
                );
            }
        });
    }

    /**
     * Creates new homeserver(s) and configures them with the blueprint provided.
     * @param blueprintName The blueprint to construct.
     * @throws if there is no blueprint with this name.
     */
    async construct(blueprintName: string): Promise<Construct> {
        const blueprint = this.blueprints.get(blueprintName);
        if (!blueprint) {
            throw new Error(`No blueprint with name '${blueprintName}'`);
        }
        const construct = new Construct(blueprint);
        if (!blueprint.homeservers) {
            throw new Error(
                `Blueprint with name '${blueprintName}' is missing homeservers`
            );
        }
        for (let hs of blueprint.homeservers) {
            // see if we should not make a HS
            let hsUrl = this.hsEnvUrlOverrides.get(hs.name.toUpperCase());
            if (hsUrl) {
                const info = new HSInfo(hs.name);
                info.url = hsUrl;
                info.image = "Set from env var";
                construct.setHomeserver(info);
                continue;
            }
            const info = await this._constructHomeserver(blueprintName, hs);
            construct.setHomeserver(info);
        }

        return construct;
    }

    async _constructHomeserver(
        blueprintName: string,
        hs: Homeserver
    ): Promise<HSInfo> {
        // try to find a cached image for this HS - TODO: Rely on Docker cache?
        let hsImage;
        const cachedInfos = this.imageCache.get(blueprintName);
        if (cachedInfos) {
            for (let info of cachedInfos) {
                if (info.name === hs.name) {
                    hsImage = info.image;
                }
            }
        }
        if (!hsImage) {
            if (!this.baseImage) {
                throw new Error(
                    `Cannot build HS '${hs.name}' from blueprint '${blueprintName}' because there is no base homeserver image to use. Set SYTS_BASE_HS_IMAGE and try again.`
                );
            }
            // run the base image and execute the blueprint
            hsImage = await docker.runBlueprint(
                this.dockerSock,
                this.baseImage,
                hs
            );
            // TODO: cache it
        }
        const hsUrl = await docker.runImage(hsImage);
        const hsInfo = new HSInfo(hs.name);
        hsInfo.url = hsUrl;
        hsInfo.image = hsImage;
        return hsInfo;
    }

    /**
     * Destroy the homeservers in this construction.
     * @param construct The homeserver(s) to destroy.
     */
    async destroy(construct: Construct) {}
}

export default Builder;
