import { ObjectID as MongoID } from "mongodb";

import RequestError from "@genezis/genezis-utils-router/RequestError";
import createRequest, { GenezisRulesConfig as BaseRequestGenezisConfig } from "@genezis/genezis-utils-router/createRequest";

import { Collection as MongoDBCollection } from "mongodb";

import GenezisChecker from "@genezis/genezis/Checker";
import GenezisCheckerError from "@genezis/genezis/CheckerError";
import GenezisCheckerErrorTypes from "@genezis/genezis/CheckerErrorTypes";

import createSearchAggregate from "./createSearchAggregate";

import numberOfObjectsWithProperty from "@genezis/genezis/utils/numberOfObjectsWithProperty";

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
        GenezisChecker(settings, {
            errorCode: GenezisChecker.integer(),
            errorMessage: GenezisChecker.string().required()
        });

        if (!settings.errorCode) settings.errorCode = 400;

        return (x) => {
            if (!MongoID.isValid(x)) throw new RequestError(settings.errorCode, settings.errorMessage);
            return MongoID(x);
        };
    },

    Integer: (settings) => {
        GenezisChecker(settings, {
            errorCode: GenezisChecker.integer(),
            errorMessage: GenezisChecker.string().required()
        });

        if (!settings.errorCode) settings.errorCode = 400;

        return (x) => {
            let n = Number.parseInt(x);
            if (Number.isNaN(n)) throw new RequestError(settings.errorCode, settings.errorMessage);
            return n;
        };
    }
};

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
export async function getCollection(collection, req, data, sharedData) {
    if (typeof collection == "function") return await collection(req, data, sharedData);
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
 * @throws {GenezisCheckerError} if the property appears multiple time with `true` value 
 */
function checkOnEmptyResponseArray(array) {
    let stopAfter = false;

    if (array) {
        let numberOfFunctionsWithStopAfter = numberOfObjectsWithProperty(array, OnEmptyResponseStopAfterProperty, true);
        if (numberOfFunctionsWithStopAfter > 1) {
            throw new GenezisCheckerError();
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
 * @GenezisChecker
 * @exports CollectionGenezisConfig
 * 
 * @description The GenezisChecker for the collection
 */
export const CollectionGenezisConfig = GenezisChecker.or([
    GenezisChecker.instanceOf(MongoDBCollection),
    GenezisChecker.function()
]);

export const MessageGenezisConfig = GenezisChecker.or([
    GenezisChecker.string(),
    GenezisChecker.function()
]);

/**
 * @name BaseGenezisConfigParams
 * 
 * @param {MongoDB.Collection | CollectionRetrieverFunction} settings.collection The MongoDB collection from where to get the data or a function that return the collection
 */

/**
 * @function
 * @internal
 * @description Generate the base GenezisChecker for each request
 * 
 * @returns {GenezisChecker}
 */
function getBaseGenezisConfig() {
    return {
        collection: CollectionGenezisConfig.required(),
        ...BaseRequestGenezisConfig
    };
}

/**
 * @name MongoDBRequestFieldsGenezisConfig
 * @type {GenezisChecker} 
 */
const MongoDBRequestFieldsGenezisConfig = GenezisChecker.array({
    of: GenezisChecker.array({
        of: GenezisChecker.object({
            shape: {
                input: GenezisChecker.string(),
                constValue: GenezisChecker.any(),
                field: GenezisChecker.required().string(),
                convertFunc: GenezisChecker.function(),
                ___: GenezisChecker.onlyOneAvailable(["input", "constValue"], { throwOnAllMissing: true })
            }
        })
    })
});

export const SingleGetterConfig = {
    ...getBaseGenezisConfig(),
    onEmptyResponse: GenezisChecker.array({
        of: GenezisChecker.function()
    }),
    getBy: MongoDBRequestFieldsGenezisConfig.required(),
    userProjectionAllowed: GenezisChecker.boolean(),
    messageOnNoOptions: MessageGenezisConfig,
    messageOnUserProjectionError: MessageGenezisConfig
};

/**
 * @function
 * @description Create a getter that can get a single MongoDB document.
 * @warning No checking are made on user projection is it is allowed
 * @exports createSingleGetter
 * @genezis genezis-utils-router
 * 
 * @param {GenezisChecker}          settings The settings for the request
 * @param {MongoDBRequestFields[]} settings.getBy The possible fields to get by the document. The order of them matters
 * @param {RequestFunction[]}      settings.onEmptyResponse An array of functions to be called when the answer from the query is empty
 * @param {Boolean}                settings.userProjectionAllowed Allow the user to set the fields to receive
 * @param {String}                 settings.messageOnNoOptions The message displayed when no options is available for the given user data
 * @param {String}                 settings.messageOnUserProjectionError
 * @combineWith ":BaseGenezisConfigParams"
 * @combineWith "genezis-utils-router/createRequest.js:GenezisRulesConfigParams"
 * 
 * @returns {RequestFunction}
 * @throws {GenezisChecker} If the configuration is wrong
 */
export function createSingleGetter(settings) {
    GenezisChecker(settings, SingleGetterConfig);

    if (!settings.userProjectionAllowed) settings.userProjectionAllowed = false;
    if (!settings.messageOnNoOptions) settings.messageOnNoOptions = "Default message for messageOnNoOptions";
    if (!settings.messageOnUserProjectionError) settings.messageOnUserProjectionError = "Default message for messageOnUserProjectionError";

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

        const collection = await getCollection(settings.collection, req, data);

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
    onEmptyResponse: GenezisChecker.array({
        of: GenezisChecker.function()
    })
};

/**
 * @function
 * @description Create a multiple getter that can get multiple MongoDB documents.
 * @warning No checking are made on user projection
 * @exports createMultipleGetter
 * @genezis genezis-utils-router
 * 
 * @param {GenezisChecker}          settings The settings for the request
 * @param {RequestFunction[]}      settings.onEmptyResponse An array of functions to be called when the answer from the query is empty
 * @combineWith ":BaseGenezisConfigParams"
 * @combineWith "genezis-utils-router/createRequest.js:GenezisRulesConfigParams"
 * 
 * @returns {RequestFunction}
 * @throws {GenezisChecker} If the configuration is wrong
 */
export function createMultipleGetter(settings) {
    GenezisChecker(settings, MultipleGetterConfig);

    let onEmptyResponseStopAfter = checkOnEmptyResponseArray(settings.onEmptyResponse);

    return createRequest(settings, async (req, data, onSuccess) => {
        let searchObject = createSearchAggregate(data);

        const collection = await getCollection(settings.collection, req, data);

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
    checker: GenezisChecker.required().function(),
    updateBy: MongoDBRequestFieldsGenezisConfig,
    messageOnNoOptions: MessageGenezisConfig,
    messageOnNoModifiedDoc: MessageGenezisConfig,
    messageOnNoUserModifiedEntry: MessageGenezisConfig,
    messageOnNoUserFindEntry: MessageGenezisConfig,
    messageOnInternalError: MessageGenezisConfig,
    createErrorMessageForChecker: GenezisChecker.function(),
    modifiedFieldName: GenezisChecker.string(),
    findFieldName: GenezisChecker.string(),
    returnTheUpdatedDoc: GenezisChecker.boolean(),
    acceptEmptyUserInput: GenezisChecker.boolean(),
    updateQuery: GenezisChecker.or([ GenezisChecker.object(), GenezisChecker.function() ]),

    afterUpdated: GenezisChecker.function(),
};

/**
 * @function
 * @description Create a single setter that can edit a MongoDB document
 * @exports createSingleSetter
 * @genezis genezis-utils-router
 * 
 * @param {GenezisChecker}          settings The settings for the request
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
 * @throws {GenezisChecker} If the configuration is wrong
 */
export function createSingleSetter(settings) {
    GenezisChecker(settings, SingleSetterConfig);

    if (!settings.messageOnNoOptions) settings.messageOnNoOptions = "Default message for messageOnNoOptions";
    if (!settings.messageOnNoModifiedDoc) settings.messageOnNoModifiedDoc = "Default message for messageOnNoModifiedDoc";
    if (!settings.messageOnNoUserModifiedEntry) settings.messageOnNoUserModifiedEntry = "Default message for messageOnNoUserModifiedEntry";
    if (!settings.messageOnNoUserFindEntry) settings.messageOnNoUserFindEntry = "Default message for messageOnNoUserFindEntry";
    if (!settings.messageOnInternalError) settings.messageOnInternalError = "Default message for messageOnInternalError";
    if (!settings.createErrorMessageForChecker) settings.createErrorMessageForChecker = (req, error) => `Checker failed for ${error.property} (default message for createErrorMessageForChecker)`;
    if (!settings.modifiedFieldName) settings.modifiedFieldName = "modified";
    if (!settings.findFieldName) settings.findFieldName = "find";
    if (!settings.returnTheUpdatedDoc) settings.returnTheUpdatedDoc = false;
    if (!settings.acceptEmptyUserInput) settings.acceptEmptyUserInput = false;

    return createRequest(settings, async (req, data, onSuccess, sharedData) => {
        if (!data[settings.modifiedFieldName]) throw new RequestError(400, await getMessage(settings.messageOnNoUserModifiedEntry));

        let findIsEmpty = !data[settings.findFieldName];
        if (!settings.acceptEmptyUserInput && findIsEmpty) throw new RequestError(400, await getMessage(settings.messageOnNoUserFindEntry));

        let docData;
        try {
            docData = await settings.checker(req, data[settings.modifiedFieldName], data, sharedData);
        } catch (error) {
            console.log("Error from checker:", error);
            if (error instanceof GenezisCheckerError) {
                throw new RequestError(400, await settings.createErrorMessageForChecker(req, error));
            } else if (error instanceof RequestError) {
                throw error;
            }

            throw new RequestError(500, await getMessage(settings.messageOnInternalError), error);
        }

        let updateQuery = settings.updateQuery
            ? await resolveHandler(settings.updateQuery, req, data[settings.findFieldName], data)
            : await constructQueryFromArrayOfVariables(settings.updateBy, data[settings.findFieldName], await getMessage(settings.messageOnNoOptions));

        const collection = await getCollection(settings.collection, req, data);

        let result;
        try {
            result = await collection.updateOne(updateQuery, docData);
        } catch (error) {
            throw new RequestError(500, error.message, error);
        }

        if (result.modifiedCount != 1) throw new RequestError(400, await getMessage(settings.messageOnNoModifiedDoc));

        if (settings.afterUpdated) {
            await settings.afterUpdated(req, data, sharedData, result);
        }

        await onSuccess(
            settings.returnTheUpdatedDoc ? result.ops[0] : {}
        );
    });
}

export const SingleAdderConfig = {
    ...getBaseGenezisConfig(),
    checker: GenezisChecker.required().function(),
    messageOnNoModifiedDoc: MessageGenezisConfig,
    createErrorMessageForChecker: GenezisChecker.string(),
    returnTheIDOfNewDoc: GenezisChecker.boolean(),
    returnTheNewDoc: GenezisChecker.boolean(),
    afterInserted: GenezisChecker.function(),

    ___: GenezisChecker.onlyOneAvailable(["returnTheIDOfNewDoc", "returnTheNewDoc"])
};

/**
 * @function
 * @description Create a single setter that can add a MongoDB document
 * @exports createSingleAdder
 * @genezis genezis-utils-router
 * 
 * @param {GenezisChecker} settings The settings for the request
 * @param {Function}               settings.createErrorMessageForChecker
 * @combineWith ":BaseGenezisConfigParams"
 * @combineWith "genezis-utils-router/createRequest.js:GenezisRulesConfigParams"
 * 
 * @returns {RequestFunction}
 * @throws {GenezisChecker} If the configuration is wrong
 */
export function createSingleAdder(settings) {
    GenezisChecker(settings, SingleAdderConfig);

    if (!settings.messageOnNoModifiedDoc) settings.messageOnNoModifiedDoc = "Default message for messageOnNoModifiedDoc";
    if (!settings.createErrorMessageForChecker) settings.createErrorMessageForChecker = (req, error) => `Checker failed for ${error.property} (default message for createErrorMessageForChecker)`;
    if (!settings.returnTheIDOfNewDoc) settings.returnTheIDOfNewDoc = false;
    if (!settings.returnTheNewDoc) settings.returnTheNewDoc = false;

    return createRequest(settings, async (req, data, onSuccess, sharedData) => {
        if (!data) throw new RequestError(400, await getMessage(settings.messageOnNoUserAddEntry));
        
        let doc;
        try {
            doc = await settings.checker(req, data, sharedData);
        } catch (error) {
            // console.log("Is Error instanceof CheckerError:", error instanceof CheckerError);
            // console.log("Is Error instanceof CheckerError:", error instanceof RequestError);
            if (error instanceof GenezisCheckerError) {
                throw new RequestError(400, await settings.createErrorMessageForChecker(req, error));
            } else if (error instanceof RequestError) {
                throw error;
            }
            
            throw new RequestError(500, await getMessage(settings.messageOnInternalError), error);
        }

        console.log("D1");

        const collection = await getCollection(settings.collection, req, data, sharedData);

        console.log("D2");

        let result;
        try {
            result = await collection.insertOne(doc);
        } catch (error) {
            throw new RequestError(500, error.message, error);
        }

        console.log("D3");

        if (result.insertedCount != 1) throw new RequestError(500, await getMessage(settings.messageOnNoModifiedDoc));

        if (settings.afterInserted) {
            await settings.afterInserted(req, data, sharedData, result);
        }

        await onSuccess(
            settings.returnTheNewDoc
                ? result.ops[0]
                : settings.returnTheIDOfNewDoc
                    ? result.insertedId.toString()
                    : {}
        );
    });
}

export const SingleDeleterConfig = {
    ...getBaseGenezisConfig(),
    messageOnNoDocFound: MessageGenezisConfig,
    messageOnNoInputFieldName: MessageGenezisConfig,
    afterDeletedRequiresDoc: GenezisChecker.boolean(),
    afterDeleted: GenezisChecker.function(),
    oneField: GenezisChecker.object({
        shape: {
            inputFieldName: GenezisChecker.string().required(),
            dbFieldName: GenezisChecker.string().required(),
            fieldTransformer: GenezisChecker.function(),
        }
    }),
    queryMaker: GenezisChecker.function()
};

export function createSingleDeleter(settings) {
    GenezisChecker(settings, SingleDeleterConfig);

    if (!settings.messageOnNoData) settings.messageOnNoData = "Default message for messageOnNoData";
    if (!settings.afterDeletedRequiresDoc) settings.afterDeletedRequiresDoc = false;
    if (!settings.queryMaker) {
        if (settings.oneField) {
            settings.queryMaker = (req, data, sharedData) => { return { [settings.dbFieldName]: data[settings.inputFieldName] }; };
        } else {
            throw new GenezisCheckerError(GenezisCheckerErrorTypes.REQUIRED_BUT_MISSING, "queryMaker");
        }
    }

    return createRequest(settings, async (req, data, onSuccess, sharedData) => {
        if (!data) throw new RequestError(400, await getMessage(settings.messageOnNoData));

        if (settings.oneField) {
            if (!data[settings.inputFieldName]) throw new RequestError(400, await getMessage(settings.messageOnNoInputFieldName));

            if (settings.fieldTransformer) data[settings.inputFieldName] = await settings.fieldTransformer(data[settings.inputFieldName]);
        }

        const collection = await getCollection(settings.collection, req, data, sharedData);
        
        let result;
        try {
            result = await collection[settings.afterDeletedRequiresDoc ? "findOneAndDelete" : "deleteOne"](await settings.queryMaker(req, data, sharedData));
        } catch (error) {
            throw new RequestError(500, error.message, error);
        }

        // TODO: Should I check if result.ok is good?

        if (settings.afterDeleted) {
            await settings.afterDeleted(req, data, sharedData, result.value);
        }

        await onSuccess({});
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
    createSingleDeleter,

    SingleGetterConfig: SingleGetterConfig,
    MultipleGetterConfig: MultipleGetterConfig,
    SingleSetterConfig: SingleSetterConfig,
    SingleAdderConfig: SingleAdderConfig,

    VariableTypes,

    notFoundOnEmptyResponse
};
