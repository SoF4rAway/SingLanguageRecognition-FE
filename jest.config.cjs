// jest.config.cjs
const nextJest = require("next/jest");

const createJestConfig = nextJest({
    dir: "./", // path to your Next app
});

const customJestConfig = {
    testEnvironment: "jest-environment-jsdom",
    setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/$1", // so imports like "@/components/..." work
    },
};

module.exports = createJestConfig(customJestConfig);
