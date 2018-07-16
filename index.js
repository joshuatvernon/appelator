#!/usr/bin/env node

const program = require('commander');
const fse = require('fs-extra');
const packages = require('all-the-package-names');
const chalk = require('chalk');

const PACKAGE_NAME = 'appelator';
const CONFIG_FILE_NAME = '/available-packages.json';
const CONFIG_FILE_PATH = __dirname + CONFIG_FILE_NAME;
const UNIX_WORDS_FILE_PATH = '/usr/share/dict/words';

let config = {
    words: new Set(),
    packages: new Set(packages),
    available: [],
    taken: []
}

/**
 * Message factory
 */
let message = (function () {
    return (messageType, ...args) => {
        let message = '';
        switch (messageType) {
            case 'invalidNumber':
                // args[0] = string that was passed but was not a number
                message = 'Argument must be a valid number but ' + chalk.red.bold(args[0]) + ' was found';
                break;
            case 'incorrectArgumentsLength':
                // args[0] = length of arguments required, args[q] = length of arguments found
                message = 'Required ' + args[0] + ' arguments but ' + chalk.red.bold(args[1]) + ' were found';
                break;
            case 'foundAllAvailable':
                // args[0] = number of taken npm package names, args[1] = number of available npm package names found
                message = 'Found ' + chalk.red.bold(args[0]) + ' taken and ' + chalk.green.bold(args[1]) + ' available NPM package names';
                break;
            case 'configIsNotPopulated':
                message = 'Available NPM package names unknown.\n\nTry running ' + chalk.blue.bold(PACKAGE_NAME + ' -f') + ' first to find available NPM package names';
                break;
            case 'directoryDoesNotExist':
                // args[0] = directory passed as argument that does not exist
                message = args[0] + ' is not a valid directory';
                break;
            case 'unixWordsFileDoesNotExist':
                message = 'Unable to find unix words file\n\nThis package only works on a unix system with the ' + chalk.blue.bold('/usr/share/dict/words') + ' file present';
                break;
            case 'noOptionsOrIncompatibleOptions':
                message = 'Either no options were passed or options passed were incompatible with each other';
                break;
            case 'searchResults':
                // args[0] = limit, args[1] = number of matches, args[2] = matches
                if (args[0] === null || args[0] > 0) {
                    if (args[0] !== null && args[0] < args[1]) {
                        message = 'Found ' + chalk.green.bold(args[1]) + ' available NPM package names, displaying ' + chalk.blue.bold(args[0]) + ':\n\n' + args[2];
                    } else {
                        message = 'Found ' + chalk.green.bold(args[1]) + ' available NPM package names:\n\n' + args[2];
                    }
                } else {
                    message = 'Found ' + chalk.red.bold(0) + ' available NPM package names';
                }
                break;
            case 'configSavedToDirectory':
                // args[0] = filepath of the saved .json file
                message = 'Saved available NPM package names to ' + chalk.blue.bold(args[0]);
                break;
            default:
                message = 'There was an unknown error; feel free to report this on ' + chalk.blue.bold('https://www.npmjs.com/') + ' or ' + chalk.blue.bold('https://wwww.github.com/');
        }
        return message;
    }
}());

/**
 * Return true if arguement is numeric and false otherwise
 */
const isValidNumericArg = (num) => {
    if (typeof(num) === typeof(true)) {
        return false;
    }
    return !isNaN(num);
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive)
 *
 * @argument min minimun number random int could be
 * @argument max maximum number random int could be
 */
const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Returns available NPM package names filter by length
 *
 * @argument exact exact length match
 * @argument min   minimum length match
 * @argument max   maximum length match
 */
const filterAvailableByLength = ({exact = null, min = null, max = null}) => {
    return config.available.filter(name => {
        if (exact !== null) {
            // exact match
            if (name.length !== exact) {
                return false;
            }
        } else {
            // with a range
            if (min !== null && max !== null && (name.length < min || name.length > max)) {
                return false;
            } else if (min !== null && name.length < min) {
                return false;
            } else if (max !== null && name.length > max) {
                return false;
            }
        }
        return true;
    });
}

/**
 * Search for available NPM packages names (either randomly macthing or by using a query)
 *
 * @argument query query string to match availabke npm package names
 * @argument limit amount of matches to return
 * @argument exact exact length match
 * @argument min   minimum length match
 * @argument max   maximum length match
 */
const search = ({query = null, random = false, limit = null, exact = null, min = null, max = null}) => {
    const availableFilteredByLength = filterAvailableByLength({exact: exact, min: min, max: max});

    let matches = [];
    if (random) {
        if (limit === null) {
            limit = 1;
        }
        let randomIndices = [];
        while (randomIndices.length < limit) {
            let randInt = getRandomInt(0, availableFilteredByLength.length - 1);
            if (randomIndices.includes(randInt)) {
                continue;
            }
            randomIndices.push(randInt);
            if (randomIndices.length < availableFilteredByLength.length) {
                matches.push(availableFilteredByLength[randInt]);
            } else {
                matches.push(availableFilteredByLength[randInt]);
                break;
            }
        }
    } else if (query !== null) {
        matches = availableFilteredByLength.filter(name => name.toLowerCase().includes(query.toLowerCase()));
    } else {
        matches = availableFilteredByLength;
    }

    if (limit !== null && matches.length > limit) {
        matches = matches.slice(0, limit);
    }

    console.log(message('searchResults', limit, matches.length, matches.join('\n')));
}

/**
 * Finds available NPM package names and saves them to the config
 */
const findAvailablePackageNames = () => {
    updateUnixWords();

    let count = 0;
    config.available = [...config.words].filter(name => !config.packages.has(name) && !config.packages.has(name.toLowerCase()));
    config.taken = [...config.words].filter(name => config.packages.has(name) || config.packages.has(name.toLowerCase()));

    console.log(message('foundAllAvailable', config.taken.length, config.available.length));

    saveConfig(CONFIG_FILE_PATH);
}

/**
 * Update the unix words saved to the config if they have not already been saved
 */
const updateUnixWords = () => {
    if (fse.existsSync(UNIX_WORDS_FILE_PATH)) {
        config.words = new Set(fse.readFileSync(UNIX_WORDS_FILE_PATH, 'utf8').split('\n'));
        config.packages = new Set(packages);
    } else {
        console.log(message('unixWordsFileDoesNotExist'));
        process.exit();
    }
}

/**
 * Exit program if the config is not populated (to be run in program when config is needed)
 */
const exitIfConfigIsNotPopulated = () => {
    if (!isConfigPopulated()) {
        console.log(message('configIsNotPopulated'));
        process.exit();
    }
}

/**
 * Return true if config is populated and false otherwise
 */
const isConfigPopulated = () => {
    if (config.words.size === 0 || config.packages.size === 0 || config.available.length === 0 || config.taken.length === 0) {
        return false;
    }
    return true;
}

/**
 * save the config
 *
 * @argument filePath filepath to save the config to
 */
const saveConfig = (filePath) => {
    serialiseConfig();
    fse.outputJsonSync(filePath, config, {spaces: 4});
}

/**
 * Serialise config into lists with lowercase values only
 */
const serialiseConfig = () => {
    config = {
        words: [...config.words].map(word => word.toLowerCase()),
        packages: [...config.packages].map(name => name.toLowerCase()),
        available: config.available.map(name => name.toLowerCase()),
        taken: config.taken.map(name => name.toLowerCase())
    }
}

/**
 * Deserialise config into sets for quicker comparisons
 */
const deserialiseConfig = () => {
    config = {
        words: new Set(config.words),
        packages: new Set(config.packages),
        available: config.available,
        taken: config.taken
    }
}

/**
 * load the config
 */
const loadConfig = () => {
    // load config
    if (fse.existsSync(CONFIG_FILE_PATH)) {
        // get config
        config = JSON.parse(fse.readFileSync(CONFIG_FILE_PATH, 'utf8'));
        deserialiseConfig();
    } else {
        // save default config
        saveConfig(CONFIG_FILE_PATH);
    }
}

/**
 * Run different functions depending on the options passed in
 */
const run = () => {
    loadConfig();

    if (program.find) {
        findAvailablePackageNames();
    } else {
        exitIfConfigIsNotPopulated();

        if (program.save) {
            const directory = program.save;
            if (!fse.existsSync(directory)) {
                console.log(message('directoryDoesNotExist', directory));
                process.exit();
            } else {
                const filePath = directory + CONFIG_FILE_NAME;
                saveConfig(filePath);
                console.log(message('configSavedToDirectory', filePath));
            }
        } else {
            if (program.limit) {
                if (isValidNumericArg(program.limit)) {
                    program.limit = Number(program.limit);
                } else {
                    console.log(message('invalidNumber', program.limit));
                }
            }
            if (program.exact) {
                if (isValidNumericArg(program.exact)) {
                    program.exact = Number(program.exact);
                } else {
                    console.log(message('invalidNumber', program.exact));
                }
            }
            if (program.min) {
                if (isValidNumericArg(program.min)) {
                    program.min = Number(program.min);
                } else {
                    console.log(message('invalidNumber', program.min));
                }
            }
            if (program.max) {
                if (isValidNumericArg(program.max)) {
                    program.max = Number(program.max);
                } else {
                    console.log(message('invalidNumber', program.max));
                }
            }
            if (program.random) {
                search({random: true, limit: program.limit, exact: program.exact, min: program.min, max: program.max});
            } else if (program.query) {
                search({query: program.query, limit: program.limit, exact: program.exact, min: program.min, max: program.max});
            } else if (isValidNumericArg(program.limit) || isValidNumericArg(program.exact) || isValidNumericArg(program.min) || isValidNumericArg(program.max)) {
                search({limit: program.limit, exact: program.exact, min: program.min, max: program.max});
            } else {
                console.log(message('noOptionsOrIncompatibleOptions'));

                program.help();
            }
        }
    }
}

program
    .version('1.0.1')
    .usage('[options]')
    .option('-f --find', 'find available and taken npm package names')
    .option('-s --save [directory]', 'save available and taken npm package names to .json file in directory')
    .option('-r --random', 'get random available npm package name (note: use limit to get more than one)')
    .option('-q --query [query]', 'get available npm package name with matching query string')
    .option('-l --limit [limit]', 'limits number of available names to return')
    .option('-e --exact [exact]', 'get available names of an exact length -- overrides min or max')
    .option('-m --min [min]', 'get available names higher than or equal to a specific length')
    .option('-M --max [max]', 'get available names lower than or equal to a specific length')
    .parse(process.argv);

run();
