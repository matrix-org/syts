class Config {
    public HS1: string = "http://localhost:8008";
    public HS2: string = "http://localhost:8007";
    public HS3: string = "http://localhost:8006";

    constructor() {
        if (process.env.CS_API) {
            this.HS1 = process.env.CS_API;
        }
    }
}

export default Config;
