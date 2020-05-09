module.exports = {
    verbose: true,
    transform: {
        ".(ts|tsx)": "ts-jest"
    },
    testMatch: [
        "**/src/tests/**/*.ts"
    ],
    moduleFileExtensions: ["ts", "tsx", "js"],
    //testEnvironment: "<rootDir>/src/sytsEnvironment.ts",
}