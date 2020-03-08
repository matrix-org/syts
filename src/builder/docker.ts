import { Homeserver } from "../blueprints/loader/blueprint";

export async function runBlueprint(
    dockerSock: string,
    baseImage: string,
    hs: Homeserver
): Promise<string> {
    console.log(`Running blueprint for hs ${hs.name}`);
    return "TODO";
}

export function runImage(imageName: string): string {
    console.log(`Running constructed image ${imageName}`);
    return "http://localhost:8008";
}
