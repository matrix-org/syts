module.exports = {
    verbose: true,
    transform: {
        ".(ts|tsx)": "ts-jest"
    },
    testMatch: [
        "**/src/tests/**/*.ts"
    ],
    moduleFileExtensions: ["ts", "tsx", "js"],
    globalSetup: "<rootDir>/src/globalSetup.ts",
    globalTeardown: "<rootDir>/src/globalTeardown.ts"
}