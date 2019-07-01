import { createGenerateOptions, stringChecker, integerChecker, booleanChecker, requiredChecker, numberChecker } from "genezis/Checker";
import { ObjectID as MongoID, Int32 as MongoInt32 } from "mongodb";
import CheckerError from "genezis/CheckerError";

let generateOptions = createGenerateOptions((generateOptions, previousChecks) => { return {
    id: (settings) => generateOptions(previousChecks.concat([(property, data, config, field, document) => {
        if (data === undefined) return;
        if (!MongoID.isValid(data)) throw new CheckerError(`The property "${property}" with data "${data}" is not a valid MongoID`, property, data);
        if (!settings.convert && !(data instanceof MongoID)) {
            throw new CheckerError("5", property, data);
        }

        if (document) document[field] = MongoID(data);
    }])),
    int32: (settings) => generateOptions(previousChecks.concat([(property, data, config, field, document) => {
        if (data === undefined) return;
        
        const isInteger = Number.isInteger(data);
        if (!isInteger) {
            if (settings.convert) {
                let converted = Number.parseInt(data);

                if (Number.isNaN(converted)) throw new CheckerError(`The property "${property}" with value "${data}" must be a number`, property, data);
                if (document) document[field] = MongoInt32(converted);
            } else {
                throw new CheckerError(`The property "${property}" with value "${data}" must be an integer`, property, data);
            }
        }

        if (document) document[field] = MongoInt32(data);
    }])),
    float: (settings) => generateOptions(previousChecks.concat([(property, data, config, field, document, collection, runtimeSettings) => {
        if (config[property] !== undefined) {
            const value = numberChecker(settings)(property, data, config, runtimeSettings);
            if (document) document[field] = value;
        }
    }])),
    unique: (settings) => generateOptions(previousChecks.concat([async (property, data, config, field, document, collection, runtimeSettings) => {
        if (runtimeSettings.__ignoreUnique) return;

        if (data === undefined) return;
        if (!collection) throw new Error("No collection given");
        
        let resultDoc = await collection.findOne({ [field]: data }, { $projection: { _id: 1 } });
        if (resultDoc) {
            if (runtimeSettings[property] && runtimeSettings[property].ignoreDocumentsWithIDs) {
                for (let i=0, length=runtimeSettings[property].ignoreDocumentsWithIDs.length; i < length; ++i) {
                    if (resultDoc._id.equals(runtimeSettings[property].ignoreDocumentsWithIDs)) throw new CheckerError("", property, data);
                }
            } else {
                throw new CheckerError("4", property, data);
            }
        }
    }])),
    string: (settings) => generateOptions(previousChecks.concat([(property, data, config, field, document, collection, runtimeSettings) => {
        if (config[property]) {
            const value = stringChecker(settings)(property, data, {}, runtimeSettings);
            if (document) document[field] = value;
        }
    }])),
    object: (settings = {}) => generateOptions(previousChecks.concat([(property, value, config, field, document, collection, runtimeSettings) => {
        if (value === undefined) return;
        if (typeof value !== "object" || Array.isArray(value)) throw new CheckerError(`The property "${property}" with value "${value}" must be an object`, property, value);

        if (settings.keysOf) {
            Object.keys(value).forEach(key => {
                settings.keysOf._.forEach(checker => checker(
                    key,
                    key,
                    { [key]: true },
                    null,
                    null,
                    null,
                    runtimeSettings
                ));
            });
        }

        if (settings.hasOwnProperty("valueOf")) {
            console.log(property, settings.valueOf, Object.keys(settings));
            Object.keys(value).forEach(key => {
                settings.valueOf._.forEach(checker => checker(
                    key, 
                    value[key], 
                    value, 
                    key,
                    value,
                    collection,
                    runtimeSettings
                ));
            });
        }

        document[field] = {};

        if (settings.shape) {
            Object.keys(settings.shape).forEach(subproperty => {
                settings.shape[subproperty].type._.forEach(checker => checker(
                    subproperty, 
                    value[subproperty], 
                    value, 
                    settings.shape[subproperty].field,
                    document[field],
                    collection,
                    runtimeSettings
                ));
            });
        } else {
            document[field] = value;
        }
    }])),
    integer: (settings) => generateOptions(previousChecks.concat([(property, data, config, field, document, collection, runtimeSettings) => {
        if (config[property] !== undefined) {
            const value = integerChecker(settings)(property, data, config, runtimeSettings);
            if (document != null) document[field] = value;
        }
    }])),
    boolean: (settings) => generateOptions(previousChecks.concat([(property, data, config, field, document, collection, runtimeSettings) => {
        if (config[property]) {
            const value = booleanChecker(settings)(property, data, config, runtimeSettings);
            if (document != null) document[field] = value;
        }
    }])),
    default: (defaultValue) => generateOptions(previousChecks.concat([(property, data, config, field, document, collection, runtimeSettings) => {
        if (runtimeSettings.___ignoreDefault) return;

        if (data === undefined) {
            document[field] = defaultValue;
        }
    }])),
    required: (settings) => generateOptions(previousChecks.concat([(property, data, config, field, document, collection, runtimeSettings) => {
        if (runtimeSettings.___ignoreRequired) return;

        requiredChecker(settings)(property, data, config, runtimeSettings);
    }])),
    array: (settings = {}) => generateOptions(previousChecks.concat([(property, data, config, field, document, collection, runtimeSettings) => {
        if (data === undefined) return;
        if (!Array.isArray(data)) throw new CheckerError(`The property "${property}" with value "${data}" must be an array`, property, data);

        if (settings.onCopies) {
            let arrayWithoutCopies = [];
            let isUniqueFunc = settings.onCopies.isUniqueFunc || ((value, array) => { return !array.includes(value) });
            if (settings.onCopies.checkBefore) {
                data.forEach(child => {
                    if (isUniqueFunc(child, arrayWithoutCopies)) arrayWithoutCopies.push(child);
                    else {
                        if (!settings.onCopies.delete) {
                            throw new CheckerError("1", property, data);
                        }
                    }
                })
            } else if (!settings.onCopies.checkAfter) {
                throw new CheckerError("2", property, data);
            }

            data = arrayWithoutCopies;
        }

        if (settings.valuesFrom) {
            const isFromArrayFunc = settings.valuesIsFromArrayFunc || ((e, valuesFrom) => valuesFrom.includes(e)); 
            data.forEach((child, index) => {
                if (!isFromArrayFunc(child, settings.valuesFrom)) {
                    throw new CheckerError("3", `${property}[${index}]`, child);
                }
            }); 
        }
    
        document[field] = [];
        // console.log("(((", document, data);
        if (settings.of) {
            data.forEach((child, index) => {
                settings.of._[0](`${property}[${index}]`, child, { [`${property}[${index}]`]: true }, index, document[field], collection, runtimeSettings)
            });
        } else {
            document[field] = data;
        }

        if (settings.fixedLength) {
            if (document.length != settings.fixedLength) throw new CheckerError(`The property "${property}" has fixedLengh=${settings.fixedLength} but the size of array is ${document.length}`, property, data);
        }
    }]))
};});

let docMaker = async (config, configSettings, collection, runtimeSettings) => {
    if (!config) throw new Error("No config given");
    if (!configSettings) throw new Error("No configSettings given");
    // if (!collection) throw new Error("No collection given");

    let document = {};

    if (!runtimeSettings) runtimeSettings = {};

    runtimeSettings.doNotModify = true;

    let promises = Object.keys(configSettings).map(property => {
        if (property == "__") {
            return Promise.all(configSettings[property]._.map(checker => checker(
                null, 
                null, 
                config, 
                null, 
                document, 
                collection, 
                runtimeSettings
            )));
        }

        if (!configSettings[property].type) throw new Error();
        if (!configSettings[property].field) throw new Error();

        return Promise.all(configSettings[property].type._.map(checker => checker(
            property, 
            config[property], 
            config, 
            configSettings[property].field, 
            document, 
            collection, 
            runtimeSettings
        )));
    });

    await Promise.all(promises);
    return document;
}

Object.assign(docMaker, generateOptions());

export default docMaker;