// app/code/Swissup/Breeze/Test/jest.config.js
module.exports = {
    // Автоматично очищати моки та виклики між тестами
    clearMocks: true,

    // Середовище тестування. 'jsdom' імітує браузерне середовище.
    testEnvironment: 'jsdom',

    // Паттерни для пошуку файлів тестів
    testMatch: [
        // "<rootDir>/view/**/?(*.)+(spec|test).[jt]s?(x)"
        // Або, якщо тести лежать окремо:
        "<rootDir>/Unit/js/**/*.test.js"
    ],

    // Директорії, які Jest має ігнорувати
    testPathIgnorePatterns: [
        "/node_modules/",
        "<rootDir>/dev/" // Якщо у вас є dev-ресурси, які не є тестами
    ],

    // Модулі, які Jest не повинен трансформувати (наприклад, сторонні бібліотеки, які вже трансформовані)
    transformIgnorePatterns: [
        "/node_modules/(?!.*(your-es6-module|another-es6-module)).+\\.js$"
    ],

    // Налаштування для автоматичного завантаження перед кожним тестом
    // Тут ми ініціалізуємо глобальні змінні, такі як jQuery та lodash
    setupFilesAfterEnv: [
        "<rootDir>/jest.setup.js"
    ],

    // Мапінг модулів для коректного імпорту, якщо це необхідно
    // Наприклад, якщо у вас є `@magento/some-lib` або шляхи, які потрібно резолвити
    moduleNameMapper: {
        "^jquery$": "<rootDir>/node_modules/jquery/dist/jquery.js",
        "^lodash$": "<rootDir>/node_modules/lodash",
        // Можливо, вам знадобиться мапінг для Breeze-специфічних шляхів
        // "^Swissup_Breeze/(.*)$": "<rootDir>/view/frontend/web/$1"
    },

    // Покриття коду
    collectCoverage: false, // Увімкніть, коли готові збирати покриття
    coverageDirectory: "<rootDir>/coverage",
    collectCoverageFrom: [
        "<rootDir>/view/**/*.js",
        "!<rootDir>/view/**/*.min.js",
        "!<rootDir>/view/**/test/**/*.js"
    ],
};
