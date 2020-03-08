import axios from "axios";
import { Deployment, Deployer } from "../deployer/deployer";

const deployer = new Deployer();
let deployment: Deployment;

describe("/register", () => {
    beforeEach(async () => {
        deployment = await deployer.deploy("clean_hs");
    });

    afterEach(async () => {
        deployer.destroy(deployment);
    });

    it("POST {} returns a set of flows", async () => {
        const res = await axios.post(
            deployment.url("hs1") + "/_matrix/client/r0/register",
            {},
            {
                validateStatus: status => {
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
});
