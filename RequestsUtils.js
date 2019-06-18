import { ObjectID as MongoID } from "mongodb";

import RequestError from "genezis-utils-router/RequestError";
import createRequest, { GenezisRulesConfig as BaseRequestGenezisConfig } from "genezis-utils-router/createRequest";

import { Collection as MongoDBCollection } from "mongodb";

import GenezisConfig from "genezis/Config";
import ConfigError from "genezis/ConfigError";

import createSearchAggregate from "./createSearchAggregate";

import numberOfObjectsWithProperty from "genezis/utils/numberOfObjectsWithProperty";

/**
 * @name MongoDBRequestField
 * @object
 * @description An object describing a request field - a field that comes from user or be constant and need to be used in a MongoDB query
 * @description One of `input` or `constValue` must be specified. They are mutually exclusive
 * 
 * @property {String} [input] A field given from the user (from request)
 * @property {Any} [constValue] A constant value
 * @property {String} field The field from the database
 * @property {TransformTypeFunction} [convertFunc] The function that converts the field to the required type
 */

/**
 * @name TransformTypeFunction
 * @function
 * 
 * @param {Any} x The value to be transformed
 * 
 * @returns {Any} The value transformed to the required type
 * @throws {RequestError} When `x` can't be transformed to the required type
 */

/**
 * @name CollectionRetrieverFunction
 * @function
 * 
 * @param {Request} req The request object
 * @param {Object} data The data of the request
 * 
 * @returns {MongoDB.Collection}
 */

/**
 * @name MongoDBRequestFields
 * @array {MongoDBRequestField}
 * @description Is an array of request fields - fields received from user that need to be used in a MongoDB query
 */

const VariableTypes = {
    MongoID: (settings) => {
        GenezisConfig(settings, {
            errorCode: GenezisConfig.integer().default(400),
            errorMessage: GenezisConfig.string().required()
        });

        return (x) => {
            if (!MongoID.isValid(x)) throw new RequestError(settings.errorCode, settings.errorMessage);
            return MongoID(x);
        }
    }
}

async function resolveHandler(variable) {
    if (typeof variable == "function") {
        let newArgs = Array.from(arguments);
        newArgs.shift();

        return await variable.apply(null, newArgs);
    }
    return variable;
}

async function getMessage(message, req) {
    if (typeof message == "function") return await message(req);
    return message;
}

/**
 * @description Get the collection from settings
 * @async
 * 
 * @param {MongoDB.Collection | CollectionRetrieverFunction} collection The collection given in the settings
 * @param {Request} req The request object
 */
export async function getCollection(collection, req) {
    if (typeof collection == "function") return await collection(req);
    return collection;
}

/**
 * @name OnEmptyResponseStopAfterProperty
 * @type {String}
 * @value "stopAfter"
 */
const OnEmptyResponseStopAfterProperty = "stopAfter";

/**
 * @description If `onEmptyResponse` is available check if one function has the property `[OnEmptyResponseStopAfterProperty]=true`
 * @description Also checks that maximum one function has the above property
 * 
 * @param {RequestFunction[]} array The array of functions to search for `[OnEmptyResponseStopAfterProperty]`
 * 
 * @returns {Number} the number of times
 * @throws {GenezisConfigError} if the property appears multiple time with `true` value 
 */
function checkOnEmptyResponseArray(array) {
    let stopAfter = false;

    if (array) {
        let numberOfFunctionsWithStopAfter = numberOfObjectsWithProperty(array, OnEmptyResponseStopAfterProperty, true);
        if (numberOfFunctionsWithStopAfter > 1) {
            throw new GenezisConfigError();
        } else if (numberOfFunctionsWithStopAfter) {
            stopAfter = true;
        }
    }

    return stopAfter;
}

/**
 * @function
 * @async
 * @description Construct a query for MongoDB from an array of MongoDBRequestFields by selecting the best candidate
 * @warning The order of MongoDBRequestFields matters
 * @devnote Parameters should be correct because they are not checked
 * 
 * @param {MongoDBRequestFields[]} array The list of options
 * @param {Object} data The data of the request
 * @param {String} messageOnNoOptions The message sent when no options is available
 * 
 * @returns {Object} the MongoDB query
 */
export async function constructQueryFromArrayOfVariables(array, data, messageOnNoOptions) {
    let query = {};

    let allGood;
    for (let i = 0, length = array.length; i < length; ++i) {
        const configData = array[i];

        allGood = true;
        query = {};

        for (let j = 0, length2 = configData.length; j < length2; ++j) {
            const fieldData = configData[j];

            if (data[fieldData.input] != undefined) {
                query[fieldData.field] = fieldData.convertFunc ? fieldData.convertFunc(data[fieldData.input]) : data[fieldData.input];
            } else {
                allGood = false;
                break;
            }
        }

        if (allGood) break;
    }

    if (!allGood) {
        throw new RequestError(400, messageOnNoOptions);
    }

    return query;
}

/**
 * @name CollectionGenezisConfig
 * @GenezisConfig
 * @exports CollectionGenezisConfig
 * 
 * @description The GenezisConfig for the collection
 */
export const CollectionGenezisConfig = GenezisConfig.or([
    GenezisConfig.instanceOf(MongoDBCollection),
    GenezisConfig.function()
]);

export const MessageGenezisConfig = GenezisConfig.or([
    GenezisConfig.string(),
    GenezisConfig.function()
])

/**
 * @name BaseGenezisConfigParams
 * 
 * @param {MongoDB.Collection | CollectionRetrieverFunction} settings.collection The MongoDB collection from where to get the data or a function that return the collection
 */

/**
 * @function
 * @internal
 * @description Generate the base GenezisConfig for each request
 * 
 * @returns {GenezisConfig}
 */
function getBaseGenezisConfig() {
    return {
        collection: CollectionGenezisConfig.required(),
        ...BaseRequestGenezisConfig
    }
}

/**
 * @name MongoDBRequestFieldsGenezisConfig
 * @type {GenezisConfig} 
 */
const MongoDBRequestFieldsGenezisConfig = GenezisConfig.array({
    of: GenezisConfig.array({
        of: GenezisConfig.object({
            shape: {
                input: GenezisConfig.string(),
                constValue: GenezisConfig.any(),
                field: GenezisConfig.required().string(),
                convertFunc: GenezisConfig.function(),
                ___: GenezisConfig.onlyOneAvailable(["input", "constValue"], { throwOnAllMissing: true })
            }
        })
    })
});

export const SingleGetterConfig = {
    ...getBaseGenezisConfig(),
    onEmptyResponse: GenezisConfig.array({
        of: GenezisConfig.function()
    }),
    getBy: MongoDBRequestFieldsGenezisConfig.required(),
    userProjectionAllowed: GenezisConfig.boolean().default(false),
    messageOnNoOptions: MessageGenezisConfig.default("Default message for messageOnNoOptions"),
    messageOnUserProjectionError: MessageGenezisConfig.default("Default message for messageOnUserProjectionError")
};

/**
 * @function
 * @description Create a getter that can get a single MongoDB document.
 * @warning No checking are made on user projection is it is allowed
 * @exports createSingleGetter
 * @genezis genezis-utils-router
 * 
 * @param {GenezisConfig}          settings The settings for the request
 * @param {MongoDBRequestFields[]} settings.getBy The possible fields to get by the document. The order of them matters
 * @param {RequestFunction[]}      settings.onEmptyResponse An array of functions to be called when the answer from the query is empty
 * @param {Boolean}                settings.userProjectionAllowed Allow the user to set the fields to receive
 * @param {String}                 settings.messageOnNoOptions The message displayed when no options is available for the given user data
 * @param {String}                 settings.messageOnUserProjectionError
 * @combineWith ":BaseGenezisConfigParams"
 * @combineWith "genezis-utils-router/createRequest.js:GenezisRulesConfigParams"
 * 
 * @returns {RequestFunction}
 * @throws {GenezisConfig} If the configuration is wrong
 */
export function createSingleGetter(settings) {
    GenezisConfig(settings, SingleGetterConfig);

    let onEmptyResponseStopAfter = checkOnEmptyResponseArray(settings.onEmptyResponse);

    return createRequest(settings, async (req, data, onSuccess) => {
        let findOneSettings = {};
        if (settings.userProjectionAllowed && data._fields) {
            // TODO: check if is object or it remains a string

            if (!Array.isArray(data._fields)) throw new RequestError(400, await getMessage(settings.messageOnUserProjectionError));

            findOneSettings.projection = {};
            for (let i = 0, length = data._fields.length; i < length; ++i) {
                findOneSettings.projection[data._fields[i]] = 1;
            }
        }

        let findOneData = await constructQueryFromArrayOfVariables(settings.getBy, data, await getMessage(settings.messageOnNoOptions));

        const collection = await getCollection(settings.collection, req);

        try {
            const doc = await collection.findOne(findOneData, findOneSettings);

            if (!doc && settings.onEmptyResponse) {
                await Promise.all(settings.onEmptyResponse.map(f => f(req, data, onSuccess)));
                if (onEmptyResponseStopAfter) return;
            }

            await onSuccess(doc);
        } catch (error) {
            if (error instanceof RequestError) throw error;

            throw new RequestError(500, error.message, error);
        }
    });
}

export const MultipleGetterConfig = {
    ...getBaseGenezisConfig(),
    onEmptyResponse: GenezisConfig.array({
        of: GenezisConfig.function()
    })
};

/**
 * @function
 * @description Create a multiple getter that can get multiple MongoDB documents.
 * @warning No checking are made on user projection
 * @exports createMultipleGetter
 * @genezis genezis-utils-router
 * 
 * @param {GenezisConfig}          settings The settings for the request
 * @param {RequestFunction[]}      settings.onEmptyResponse An array of functions to be called when the answer from the query is empty
 * @combineWith ":BaseGenezisConfigParams"
 * @combineWith "genezis-utils-router/createRequest.js:GenezisRulesConfigParams"
 * 
 * @returns {RequestFunction}
 * @throws {GenezisConfig} If the configuration is wrong
 */
export function createMultipleGetter(settings) {
    GenezisConfig(settings, MultipleGetterConfig);

    let onEmptyResponseStopAfter = checkOnEmptyResponseArray(settings.onEmptyResponse);

    return createRequest(settings, async (req, data, onSuccess) => {
        let searchObject = createSearchAggregate(data);

        const collection = await getCollection(settings.collection, req);

        try {
            const cursor = collection.aggregate(searchObject);

            const docs = await cursor.toArray();

            if (docs.length == 0 && settings.onEmptyResponse) {
                await Promise.all(settings.onEmptyResponse.map(f => f(req, data, onSuccess)));
                if (onEmptyResponseStopAfter) return;
            }

            await onSuccess(data.onlyCount ? docs.length : docs);
        } catch (error) {
            if (error instanceof RequestError) throw error;

            throw new RequestError(500, error.message, error);
        }
    });
}

export const SingleSetterConfig = {
    ...getBaseGenezisConfig(),
    checker: GenezisConfig.required().function(),
    updateBy: MongoDBRequestFieldsGenezisConfig,
    messageOnNoOptions: MessageGenezisConfig.default("Default message for messageOnNoOptions"),
    messageOnNoModifiedDoc: MessageGenezisConfig.default("Default message for messageOnNoModifiedDoc"),
    messageOnNoUserModifiedEntry: MessageGenezisConfig.default("Default message for messageOnNoUserModifiedEntry"),
    messageOnNoUserFindEntry: MessageGenezisConfig.default("Default message for messageOnNoUserFindEntry"),
    messageOnInternalError: MessageGenezisConfig.default("Default message for messageOnInternalError"),
    createErrorMessageForChecker: GenezisConfig.string().default((req, error) => `Checker failed for ${error.property} (default message for createErrorMessageForChecker)`),
    modifiedFieldName: GenezisConfig.string().default("modified"),
    findFieldName: GenezisConfig.string().default("find"),
    returnTheUpdatedDoc: GenezisConfig.boolean().default(false),
    acceptEmptyUserInput: GenezisConfig.boolean().default(false),
    updateQuery: GenezisConfig.or([ GenezisConfig.object(), GenezisConfig.function() ])
};

/**
 * @function
 * @description Create a single setter that can edit a MongoDB document
 * @exports createSingleSetter
 * @genezis genezis-utils-router
 * 
 * @param {GenezisConfig}          settings The settings for the request
 * @param {MongoDBRequestFields[]} settings.updateBy The possible fields to find the document to edit. The order of them matters
 * @param {String}                 settings.messageOnNoOptions The message displayed when no options is available for the given user data
 * @param {String}                 settings.messageOnNoModifiedDoc The message displayed when no document is modified
 * @param {String}                 settings.messageOnNoUserModifiedEntry The message to display when user forget to send `modified` object
 * @param {String}                 settings.messageOnNoUserFindEntry The message to display when user forget to send `find` object
 * @param {String}                 settings.messageOnInternalError
 * @param {Function}               settings.createErrorMessageForChecker
 * @param {Booelean}               settings.acceptEmptyUserInput
 * @param {Object | Function}      settings.updateQuery
 * @combineWith ":BaseGenezisConfigParams"
 * @combineWith "genezis-utils-router/createRequest.js:GenezisRulesConfigParams"
 * 
 * @returns {RequestFunction}
 * @throws {GenezisConfig} If the configuration is wrong
 */
export function createSingleSetter(settings) {
    GenezisConfig(settings, SingleSetterConfig);

    return createRequest(settings, async (req, data, onSuccess) => {
        if (!data[settings.modifiedFieldName]) throw new RequestError(400, await getMessage(settings.messageOnNoUserModifiedEntry));

        let findIsEmpty = !data[settings.findFieldName];
        if (!settings.acceptEmptyUserInput && findIsEmpty) throw new RequestError(400, await getMessage(settings.messageOnNoUserFindEntry));

        let docData;
        try {
            docData = await settings.checker(req, data[settings.modifiedFieldName], data);
        } catch (error) {
            console.log("Error from checker:", error);
            if (error instanceof ConfigError) {
                throw new RequestError(400, await settings.createErrorMessageForChecker(req, error));
            } else if (error instanceof RequestError) {
                throw error;
            }

            throw new RequestError(500, await getMessage(settings.messageOnInternalError), error)
        }

        let updateQuery = settings.updateQuery
            ? await resolveHandler(settings.updateQuery, req, data[settings.findFieldName], data)
            : await constructQueryFromArrayOfVariables(settings.updateBy, data[settings.findFieldName], await getMessage(settings.messageOnNoOptions));

        const collection = await getCollection(settings.collection, req);

        let result;
        try {
            result = await collection.updateOne(updateQuery, docData);
        } catch (error) {
            throw new RequestError(500, error.message, error);
        }

        if (result.modifiedCount != 1) throw new RequestError(400, await getMessage(settings.messageOnNoModifiedDoc));

        await onSuccess(
            settings.returnTheUpdatedDoc ? result.ops[0] : {}
        );
    });
}

export const SingleAdderConfig = {
    ...getBaseGenezisConfig(),
    checker: GenezisConfig.required().function(),
    messageOnNoModifiedDoc: MessageGenezisConfig.default("Default message for messageOnNoModifiedDoc"),
    createErrorMessageForChecker: GenezisConfig.string().default((req, error) => `Checker failed for ${error.property} (default message for createErrorMessageForChecker)`),
    returnTheIDOfNewDoc: GenezisConfig.boolean().default(false),
    returnTheNewDoc: GenezisConfig.boolean().default(false),
    ___: GenezisConfig.onlyOneAvailable(["returnTheIDOfNewDoc", "returnTheNewDoc"])
};

/**
 * @function
 * @description Create a single setter that can add a MongoDB document
 * @exports createSingleAdder
 * @genezis genezis-utils-router
 * 
 * @param {GenezisConfig} settings The settings for the request
 * @param {Function}               settings.createErrorMessageForChecker
 * @combineWith ":BaseGenezisConfigParams"
 * @combineWith "genezis-utils-router/createRequest.js:GenezisRulesConfigParams"
 * 
 * @returns {RequestFunction}
 * @throws {GenezisConfig} If the configuration is wrong
 */
export function createSingleAdder(settings) {
    GenezisConfig(settings, SingleAdderConfig);

    return createRequest(settings, async (req, data, onSuccess) => {
        if (!data) throw new RequestError(400, await getMessage(settings.messageOnNoUserAddEntry));
        
        let doc;
        try {
            doc = await settings.checker(req, data);
        } catch (error) {
            console.log("Is Error instanceof ConfigError:", error instanceof ConfigError);
            console.log("Is Error instanceof ConfigError:", error instanceof RequestError);
            if (error instanceof ConfigError) {
                throw new RequestError(400, await settings.createErrorMessageForChecker(req, error));
            } else if (error instanceof RequestError) {
                throw error;
            }
            
            throw new RequestError(500, await getMessage(settings.messageOnInternalError), error);
        }

        const collection = await getCollection(settings.collection, req);

        let result;
        try {
            result = await collection.insertOne(doc);
        } catch (error) {
            throw new RequestError(500, error.message, error);
        }

        if (result.insertedCount != 1) throw new RequestError(500, await getMessage(settings.messageOnNoModifiedDoc));

        await onSuccess(
            settings.returnTheNewDoc
                ? result.ops[0]
                : settings.returnTheIDOfNewDoc
                    ? result.insertedId.toString()
                    : {}
        );
    });
}

function notFoundOnEmptyResponse(message) {
    let f = (onSuccess) => {
        throw new RequestError(404, message);
    };

    f.stopAfter = true;

    return f;
}

export default {
    createSingleGetter,
    createSingleSetter,
    createSingleAdder,
    createMultipleGetter,

    SingleGetterConfig: SingleGetterConfig,
    MultipleGetterConfig: MultipleGetterConfig,
    SingleSetterConfig: SingleSetterConfig,
    SingleAdderConfig: SingleAdderConfig,

    VariableTypes,

    notFoundOnEmptyResponse
};