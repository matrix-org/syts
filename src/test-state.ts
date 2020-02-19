import Config from "./config";

/*
 * TestState contains the overall prepared state for the test.
 */
class TestState {
    public homeservers: Map<string, HSState>;
    constructor(cfg: Config) {
        this.homeservers[cfg.HS1] = new HSState(cfg.HS1);
        this.homeservers[cfg.HS2] = new HSState(cfg.HS2);
        this.homeservers[cfg.HS3] = new HSState(cfg.HS3);
    }
}

/**
 * HSState contains the state of a Homeserver for a test.
 */
class HSState {
    public url: string;
    public users: Map<String, User>; // user id => User
    public rooms: Map<String, Room>; // room id => Room
    constructor(url: string) {
        this.url = url;
        this.users = new Map<String, User>();
        this.rooms = new Map<String, Room>();
    }
}

class User {
    public id: string;
    public displayName: string;
    public avatarUrl: string;
}

class Room {
    public id: string;
    public name: string;
    public topic: string;
    public members: Map<String, RoomMember>; // user id => RoomMember
}

class RoomMember {
    public user: User;
    public membership: string;
}

export default TestState;
