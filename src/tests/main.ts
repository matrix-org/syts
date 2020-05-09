import axios from "axios";
import { Deployment, DockerDeployer } from "../deployer/docker";
import { setupDocker, teardownDocker } from "../sytsEnvironment";

const deployer = new DockerDeployer("register");
let deployment: Deployment;

// TODO: when https://github.com/facebook/jest/pull/8751 merges, rely on the environment instead.
beforeAll(() => {
    return setupDocker();
});
afterAll(() => {
    return teardownDocker();
});

describe("/register", () => {
    beforeEach(async () => {
        deployment = await deployer.deploy("clean_hs");
    });

    afterEach(async () => {
        await deployer.destroy(deployment);
    });

    it("POST {} returns a set of flows", async () => {
        const res = await axios.post(
            deployment.url("hs1") + "/_matrix/client/r0/register",
            {},
            {
                validateStatus: (status) => {
                    return status === 401;
                },
            }
        );
        expect(res.headers["content-type"]).toBe("application/json");
        expect(Array.isArray(res.data["flows"])).toBe(true);
        // TODO: sytest checks for m.login.dummy and makes use of it later, we need to think about
        // how to manage this.
        res.data["flows"].forEach((flow: { stages: string[] }) => {
            expect(Array.isArray(flow["stages"])).toBe(true);
        });
    });

    it("POST /register can create a user", async () => {
        const res = await axios.post(
            deployment.url("hs1") + "/_matrix/client/r0/register",
            {
                auth: {
                    type: "m.login.dummy",
                },
                username: "post-can-create-a-user",
                password: "sUp3rs3kr1t",
            }
        );
        expect(typeof res.data.access_token).toEqual("string");
        expect(typeof res.data.user_id).toEqual("string");
    });

    it("POST /register downcases capitals in usernames", async () => {
        const res = await axios.post(
            deployment.url("hs1") + "/_matrix/client/r0/register",
            {
                auth: {
                    type: "m.login.dummy",
                },
                username: "user-UPPER",
                password: "sUp3rs3kr1t",
            }
        );
        expect(typeof res.data.access_token).toEqual("string");
        expect(res.data.user_id.startsWith("@user-upper")).toBe(true);
    });

    it("POST /register returns the same device_id as that in the request", async () => {
        const deviceId = "my_device_id";
        const res = await axios.post(
            deployment.url("hs1") + "/_matrix/client/r0/register",
            {
                auth: {
                    type: "m.login.dummy",
                },
                username: "user",
                password: "sUp3rs3kr1t",
                device_id: deviceId,
            }
        );
        expect(typeof res.data.access_token).toEqual("string");
        expect(res.data.device_id).toEqual(deviceId);
    });

    it("POST /register rejects usernames with special characters", async () => {
        const specialChars = [
            `!`,
            `"`,
            `:`,
            `?`,
            `\\`,
            `@`,
            `[`,
            `]`,
            `{`,
            `|`,
            `}`,
            `£`,
            `é`,
            `\n`,
            `'`,
        ];
        let promises: Array<Promise<any>> = [];
        for (let i = 0; i < specialChars.length; i++) {
            promises.push(
                axios
                    .post(
                        deployment.url("hs1") + "/_matrix/client/r0/register",
                        {
                            auth: {
                                type: "m.login.dummy",
                            },
                            username:
                                "user-" + specialChars[i] + "-reject-please",
                            password: "sUp3rs3kr1t",
                        },
                        {
                            validateStatus: (status) => {
                                return status === 400;
                            },
                        }
                    )
                    .then((res) => {
                        expect(res.data.errcode).toEqual("M_INVALID_USERNAME");
                    })
            );
        }
        await promises;
    });
});
