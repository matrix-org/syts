import axios from "axios";
import Config from "../config";
import { Construct } from "../construct";

const cfg = new Config();
let construct: Construct;

describe("/register", () => {
    beforeEach(async () => {
        construct = await cfg.construct("clean_hs");
    });

    it("POST {} returns a set of flows", async () => {
        const res = await axios.post(
            construct.url("hs1") + "/_matrix/client/r0/register",
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
