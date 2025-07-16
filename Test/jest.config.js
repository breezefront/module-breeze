// app/code/Swissup/Breeze/Test/jest.config.js
module.exports = {
    rootDir: '..',
    setupFilesAfterEnv: [
        "<rootDir>/Test/jest.setup.js"
    ],
    // Автоматично очищати моки та виклики між тестами
    // Це гарна практика, залиште.
    clearMocks: true,

    // Середовище тестування. 'jsdom' імітує браузерне середовище.
    // Обов'язково для тестування DOM-операцій. Залиште.
    testEnvironment: 'jsdom',

    // Паттерни для пошуку файлів тестів
    // Це важливо для Jest, щоб знайти ваші .test.js файли.
    // "<rootDir>/Unit/js/**/*.test.js" - це правильний шлях для вашої структури. Залиште.
    testMatch: [
        "<rootDir>/Test/Unit/js/**/*.test.js"
    ],

    // Директорії, які Jest має ігнорувати
    // '/node_modules/' - обов'язково.
    // '<rootDir>/dev/' - залиште, якщо у вас є така папка з файлами, які не є тестами.
    testPathIgnorePatterns: [
        "/node_modules/",
    ],

    // Модулі, які Jest не повинен трансформувати.
    // Якщо ваш код (async.js) написаний на сучасному JavaScript (ES6+),
    // і ви використовуєте Babel для транспіляції, то Jest буде використовувати Babel
    // для трансформації *вашого* коду. Ця опція каже Jest *не* трансформувати файли з node_modules.
    // Це стандартне налаштування, залиште його.
    transformIgnorePatterns: [
        "/node_modules/" // Ігноруємо всі node_modules за замовчуванням
    ],

    // Мапінг модулів для коректного імпорту, якщо це необхідно
    // Це налаштування є коректним і дозволяє використовувати `@breeze-module/` як псевдонім
    // для кореневої папки вашого модуля (`module-breeze`).
    moduleNameMapper: {
        '^@breeze-module/(.*)$': '<rootDir>/$1',
        // "^jquery$": "<rootDir>/node_modules/jquery/dist/jquery.js", // Можна прибрати, якщо $ мокається глобально
        // "^lodash$": "<rootDir>/node_modules/lodash"                 // Можна прибрати, якщо _ мокається глобально
    },

    // Покриття коду
    collectCoverage: false, // Вимкнено за замовчуванням, це добре для швидких прогонів.
    coverageDirectory: "<rootDir>/coverage", // Директорія для звітів покриття.

    // Це налаштування вказує Jest, для яких файлів збирати покриття.
    // Оскільки ваш `jest.config.js` знаходиться у `Test`, а `rootDir` встановлено на `..` (тобто на `module-breeze`),
    // шлях "<rootDir>/view/**/*.js" *є правильним* і вказує на:
    // `/media/om3r/disk500/Work/magento248.local/src/vendor/swissup/module-breeze/view/**/*.js`
    // Це включатиме ваш `async.js` файл.
    // Якщо ви хочете збирати покриття, розкоментуйте ці рядки.
    collectCoverageFrom: [
        "<rootDir>/view/**/*.js", // Це включатиме async.js
        "!<rootDir>/view/**/*.min.js", // Виключаємо мініфіковані файли
        "!<rootDir>/view/**/test/**/*.js" // Виключаємо тестові файли, якщо вони є у папці view
    ],
};
