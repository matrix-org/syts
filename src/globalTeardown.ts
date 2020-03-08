import DockerBuilder from "./builder/docker";

// This file gets executed as a globalTeardown hook when jest runs. See jest.config.js

// TODO: Destroy all docker images made.

module.exports = async function() {
    console.log("Global teardown");
};
