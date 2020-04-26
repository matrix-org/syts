import { Homeserver } from "./blueprint";
import axios, { Method } from "axios";

// Instruction represents an HTTP request which should be made to a remote server
type Instruction = {
    // The HTTP method e.g GET POST PUT
    method: Method;
    // The HTTP path, starting with '/', without the base URL. Will have placeholder values of the form $foo which need
    // to be replaced based on 'substitutions'.
    path: string;
    // The HTTP body, typically stringified JSON
    body: string;
    // The access_token to use in the request, represented as a key to use in the lookup table e.g "user_@alice:localhost"
    // Null if no token should be used (e.g /register requests).
    access_token: string | null;
    // The path or query placeholders to replace e.g "/foo/$roomId" with the substitution { $roomId: "room_1"}.
    // The key is the path param e.g $foo and the value is the lookup table key e.g "room_id".
    substitutions?: Record<string, string>;
    // The fields (expressed as dot-style notation) which should be stored in a lookup table for later use.
    // E.g to store the room_id in the response under the key 'foo' to use it later: { "foo" : ".room_id" }
    storeResponse?: { [key: string]: string };
};

// HSRequest is an HTTP request whch can be sent via Axios as-is, or can be transformed to curl etc.
interface HSRequest {
    url: string;
    baseURL: string;
    method: Method;
    params: { [key: string]: string }; // query params
    data: any;
}

export class InstructionRunner {
    instructions: Array<Instruction>;
    lookup: { [key: string]: string };
    index: number;

    constructor(hs: Homeserver) {
        this.instructions = calculateInstructions(hs);
        this.lookup = {};
        this.index = 0;
    }

    // Run all instructions until completion. Throws if there was a problem executing any instruction.
    async run(baseUrl: string) {
        let entry = this.next(baseUrl);
        while (entry != undefined) {
            try {
                const response = await axios.request(entry.req);
                if (response.status < 200 || response.status >= 300) {
                    throw new Error(
                        `Request ${JSON.stringify(entry.req)} returned HTTP ${
                            response.status
                        } : ${response.data}`
                    );
                }

                if (entry.instr.storeResponse) {
                    for (let [key, value] of Object.entries(
                        entry.instr.storeResponse
                    )) {
                        this.lookup[key] = mapDotStyleKey(response.data, value);
                    }
                }
            } catch (err) {
                console.error(
                    `Error: ${JSON.stringify(entry.req)} returned =====> HTTP ${
                        err.response.status
                    } => ${JSON.stringify(err.response.data)}`
                );
                throw new Error(
                    `Failed to execute HTTP requests on ${baseUrl}`
                );
            }
            entry = this.next(baseUrl);
        }
    }

    // Returns the next instruction as an Axios-style request object.
    next(baseUrl: string): { req: HSRequest; instr: Instruction } | undefined {
        if (this.index >= this.instructions.length) {
            return;
        }
        const instr = this.instructions[this.index];
        this.index++;

        const qps: { [key: string]: string } = {};
        if (instr.access_token) {
            qps["access_token"] = this.lookup[instr.access_token];
        }
        return {
            req: {
                url: encodeUri(
                    instr.path,
                    instr.substitutions || {},
                    this.lookup
                ),
                baseURL: baseUrl,
                method: instr.method,
                data: instr.body,
                params: qps,
            },
            instr: instr,
        };
    }
}

// calculateInstructions returns the entire set of HTTP requests to be executed in order. Various substitutions
// and placeholders are returned in these instructions as it's impossible to know at this time what room IDs etc
// will be allocated, so use an instruction loader to load the right requests.
function calculateInstructions(hs: Homeserver): Array<Instruction> {
    const instructions: Array<Instruction> = [];
    // add instructions to create users
    hs.users?.forEach((user) => {
        const storeRes: { [key: string]: string } = {};
        storeRes[`user_${user.localpart}`] = ".access_token";

        instructions.push({
            method: "POST",
            path: "/_matrix/client/r0/register",
            body: JSON.stringify({
                auth: {
                    type: "m.login.dummy",
                },
                username: user.localpart,
                password: "syts_meets_min_pasword_req_" + user.localpart,
            }),
            access_token: null,
            storeResponse: storeRes,
        });
    });
    // add instructions to create rooms and send events
    hs.rooms?.forEach((room, roomIndex) => {
        const storeRes: { [key: string]: string } = {};
        storeRes[`room_${roomIndex}`] = ".room_id";

        instructions.push({
            method: "POST",
            path: "/_matrix/client/r0/createRoom",
            body: JSON.stringify(room.createRoom),
            access_token: `user_${room.creator}`,
            storeResponse: storeRes,
        });
        room.events?.forEach((event, eventIndex) => {
            let path = "";
            const subs: { [key: string]: string } = {};
            subs["roomId"] = `room_${roomIndex}`;
            subs["eventType"] = event.type;
            if (event.state_key != null) {
                path =
                    "/_matrix/client/r0/rooms/{roomId}/state/{eventType}/{stateKey}";
                subs["stateKey"] = `${event.state_key}`;
            } else {
                path =
                    "/_matrix/client/r0/rooms/{roomId}/send/{eventType}/{txnId}";
                subs["txnId"] = `${eventIndex}`;
            }
            instructions.push({
                method: "PUT",
                path: path,
                body: JSON.stringify(room.createRoom),
                access_token: `user_${event.sender}`,
                substitutions: subs,
            });
        });
    });

    // add instructions to create messages in rooms
    return instructions;
}

/**
 * Encodes a URI according to a set of template variables. Variables will be
 * passed through encodeURIComponent.
 * @param {string} pathTemplate The path with template variables e.g. '/foo/$bar'.
 * @param {Object} variables The key/value pairs to replace the template
 * variables with. E.g. { "$bar": "baz" }, where "baz" is then looked up in the lookup table.
 * @param {Object} lookup The lookup table to search for "baz".
 * @return {string} The result of replacing all template variables e.g. '/foo/baz'.
 */
function encodeUri(
    pathTemplate: string,
    variables: Record<string, string>,
    lookup: Record<string, string>
): string {
    for (const key in variables) {
        if (!variables.hasOwnProperty(key)) {
            continue;
        }
        pathTemplate = pathTemplate.replace(
            key,
            encodeURIComponent(lookup[variables[key]])
        );
    }
    return pathTemplate;
}

function mapDotStyleKey(jsonObj: any, dotKey: string): string {
    const fields = dotKey.split(".");
    let curr = jsonObj;
    for (let i = 0; i < fields.length; i++) {
        if (!fields[i]) {
            continue;
        }
        curr = curr[fields[i]];
        if (!curr) {
            throw new Error(
                `missing key in json object: ${jsonObj} want ${dotKey}`
            );
        }
    }
    return curr;
}

export default InstructionRunner;
