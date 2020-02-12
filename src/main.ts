import axios from "axios";

describe("/register", () => {
    it("POST {} returns a set of flows", async () => {
        // TODO: Indirect CS_API in case we want to inject it some other way
        const res = await axios.post(
            process.env.CS_API + "/_matrix/client/r0/register",
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
