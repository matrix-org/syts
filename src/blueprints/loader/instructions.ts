import { Homeserver } from "./blueprint";

export type Instruction = {
    method: string;
    path: string;
    body: string;
};

export function calculateInstructions(hs: Homeserver): Array<Instruction> {
    const instructions: Array<Instruction> = [];
    // TODO: How to manage data from prev request? How to manage access tokens?
    // add instructions to create users
    hs.users?.forEach(user => {
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
        });
    });

    // add instructions to create rooms

    // add instructions to create messages in rooms
    return instructions;
}

export default calculateInstructions;
