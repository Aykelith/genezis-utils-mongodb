//= Functions & Modules
// Own
import createSearchAggregate from "./createSearchAggregate";
// Packages
import GenezisChecker from "@genezis/genezis/Checker";
import GenezisGeneralError from "@genezis/genezis/GenezisGeneralError";
import GenezisCheckerError from "@genezis/genezis/CheckerError";
import numberOfObjectsWithProperty from "@genezis/genezis/utils/numberOfObjectsWithProperty";
import { ObjectID as MongoID, Collection as MongoDBCollection } from "mongodb";
import RequestError from "@genezis/genezis-utils-router/RequestError";
import createRequest, { GenezisRulesConfig as BaseRequestGenezisConfig } from "@genezis/genezis-utils-router/createRequest";

//= Structures & Data
// Packages
import GenezisCheckerErrorTypes from "@genezis/genezis/CheckerErrorTypes";

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

const        ErrorsBase = "genezis-utils-mongodb__requestsutils";
export const Errors = {
    QUERY_FROM_GIVEN_FIELDS_NOT_FOUND_MATCH: `${ErrorsBase}__query_from_given_fields_not_found_match`,
    NO_MODIFIED_DOC: `${ErrorsBase}__no_modified_doc`,
    EDIT_REQUEST__NO_USER_MODIFIED_ENTRY: `${ErrorsBase}__edit_request__no_user_modified_entry`,
    EDIT_REQUEST__NO_USER_FIND_ENTRY: `${ErrorsBase}__edit_request__no_user_find_entry`,
    ADD_REQUEST__NO_USER_ADD_ENTRY: `${ErrorsBase}__add_request__no_user_add_entry`,
    DELETE_REQUEST__NO_INPUT_FIELD_NAME: `${ErrorsBase}__delete_request__no_input_field_name`,
    DELETE_REQUEST__NO_DOCUMENT_DELETED: `${ErrorsBase}__delete_request__no_document_deleted`
};

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
 * 
 * @returns {Object} the MongoDB query
 */
export async function constructQueryFromArrayOfVariables(array, data) {
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
        return false;
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
        onError: GenezisChecker.function(),
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
    getBy: MongoDBRequestFieldsGenezisConfig,
    userProjectionAllowed: GenezisChecker.boolean(),
    userProjectionInputField: GenezisChecker.string(),
    customOnSuccess: GenezisChecker.function(),
    findQueryMiddleware: GenezisChecker.function(),
    customFindQueryMaker: GenezisChecker.function(),
    customFindOneSettings: GenezisChecker.function(),
    checksBeforeGettingDoc: GenezisChecker.function()
};

/**
 * @function
 * @description Create a getter that can get a single MongoDB document.
 * @warning No checking are made on user projection is it is allowed
 * @exports createSingleGetter
 * @genezis genezis-utils-router
 * 
 * @param {GenezisChecker}         settings The settings for the request
 * @param {MongoDBRequestFields[]} settings.getBy The possible fields to get by the document. The order of them matters
 * @param {RequestFunction[]}      settings.onEmptyResponse An array of functions to be called when the answer from the query is empty
 * @param {Boolean}                settings.userProjectionAllowed Allow the user to set the fields to receive
 * @combineWith ":BaseGenezisConfigParams"
 * @combineWith "genezis-utils-router/createRequest.js:GenezisRulesConfigParams"
 * 
 * @returns {RequestFunction}
 * @throws {GenezisChecker} If the configuration is wrong
 */
export function createSingleGetter(settings) {
    GenezisChecker(settings, SingleGetterConfig);

    if (!settings.userProjectionAllowed) {
        settings.userProjectionAllowed = false;

        if (settings.userProjectionInputField) throw new Error("The argument \"userProjectionAllowed\" is false, but the argument \"userProjectionInputField\" was defined");
    } else {
        if (!settings.userProjectionInputField) throw new Error("The argument \"userProjectionAllowed\" is true, but the argument \"userProjectionInputField\" is missing");
    }

    if (settings.customFindQueryMaker) {
        if (settings.getBy) throw new Error("You can't specify \"customFindQueryMaker\" and \"getBy\" togheter");
    } else {
        if (!settings.getBy) throw new Error("You can't specify \"customFindQueryMaker\" and \"getBy\" togheter");
    }

    if (!settings.onError) settings.onError = (error) => { throw error; }

    return createRequest(settings, async (req, data, onSuccess, sharedData) => {
        let findOneSettings = {};
        if (settings.userProjectionAllowed && data[settings.userProjectionInputField]) {
            // TODO: check if is object or it remains a string

            if (!Array.isArray(data[settings.userProjectionInputField])) {
                await settings.onError(
                    new GenezisCheckerError(GenezisCheckerErrorTypes.NOT_ARRAY, settings.userProjectionInputField), 
                    req, 
                    data, 
                    sharedData
                );
            }

            findOneSettings.projection = {};
            for (let i = 0, length = data[settings.userProjectionInputField].length; i < length; ++i) {
                findOneSettings.projection[data[settings.userProjectionInputField][i]] = 1;
            }
        }

        if (settings.customFindOneSettings) {
            findOneSettings = await resolveHandler(settings.customFindOneSettings, req, data, sharedData, findOneSettings);
        }

        let findOneQuery;
        if (settings.customFindQueryMaker) {
            findOneQuery = settings.customFindQueryMaker(req, data, sharedData);

            if (!findOneQuery) {
                throw new Error("The function \"customFindQueryMaker\" should return the search object");
            }
        } else {
            findOneQuery = await constructQueryFromArrayOfVariables(settings.getBy, data);

            if (!findOneQuery) {
                await settings.onError(
                    new GenezisGeneralError(Errors.QUERY_FROM_GIVEN_FIELDS_NOT_FOUND_MATCH), 
                    req, 
                    data, 
                    sharedData
                );
            }

            if (settings.findQueryMiddleware) {
                findOneQuery = await resolveHandler(settings.findQueryMiddleware, req, data, sharedData, findOneQuery);

                if (!findOneQuery) {
                    throw new Error("The function \"findQueryMiddleware\" should return the search object");
                }
            }
        }

        if (settings.checksBeforeGettingDoc) {
            await settings.checksBeforeGettingDoc(req, data, sharedData, findOneQuery, findOneSettings);
        }
        
        const collection = await getCollection(settings.collection, req, data, sharedData);

        try {
            const doc = await collection.findOne(findOneQuery, findOneSettings);

            if (!doc && settings.onNoDocumentFound) {
                if ((await settings.onNoDocumentFound(req, data, sharedData, onSuccess))) return;
            }

            if (settings.customOnSuccess) await settings.customOnSuccess(req, data, sharedData, onSuccess, doc);
            else await onSuccess(doc);
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
    }),
    searchQueryMiddleware: GenezisChecker.function()
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

    return createRequest(settings, async (req, data, onSuccess, sharedData) => {
        let searchObject = createSearchAggregate(data);

        if (settings.searchQueryMiddleware) {
            searchObject = await settings.searchQueryMiddleware(req, data, sharedData, searchObject);
        }

        const collection = await getCollection(settings.collection, req, data, sharedData);

        try {
            const cursor = collection.aggregate(searchObject);

            const docs = await cursor.toArray();

            if (docs.length == 0 && settings.onEmptyResponse) {
                await Promise.all(settings.onEmptyResponse.map(f => f(req, data, onSuccess)));
                if (onEmptyResponseStopAfter) return;
            }

            if (settings.afterGetting) {
                await settings.afterGetting(req, data, sharedData, docs);
            }

            await onSuccess(data.onlyCount ? (docs[0] ? docs[0].number : 0) : docs);
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
 * @param {GenezisChecker}         settings The settings for the request
 * @param {MongoDBRequestFields[]} settings.updateBy The possible fields to find the document to edit. The order of them matters
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

    if (!settings.modifiedFieldName) settings.modifiedFieldName = "modified";
    if (!settings.findFieldName) settings.findFieldName = "find";
    if (!settings.returnTheUpdatedDoc) settings.returnTheUpdatedDoc = false;
    if (!settings.acceptEmptyUserInput) settings.acceptEmptyUserInput = false;

    if (!settings.onError) settings.onError = (error) => { throw error; }

    return createRequest(settings, async (req, data, onSuccess, sharedData) => {
        if (!data[settings.modifiedFieldName]) await settings.onError(
            new GenezisGeneralError(Errors.EDIT_REQUEST__NO_USER_MODIFIED_ENTRY, settings.modifiedFieldName),
            req,
            data,
            sharedData    
        );

        let findIsEmpty = !data[settings.findFieldName];
        if (!settings.acceptEmptyUserInput && findIsEmpty) await settings.onError(
            new GenezisGeneralError(Errors.EDIT_REQUEST__NO_USER_FIND_ENTRY, settings.findFieldName),
            req,
            data,
            sharedData    
        );

        sharedData.updateQuery = {};
        if (settings.updateBy) {
            sharedData.updateQuery = await constructQueryFromArrayOfVariables(settings.updateBy, data[settings.findFieldName]);

            if (!sharedData.updateQuery) await settings.onError(
                new GenezisGeneralError(Errors.QUERY_FROM_GIVEN_FIELDS_NOT_FOUND_MATCH), 
                req, 
                data, 
                sharedData
            );
        }

        if (settings.updateQuery) {
            sharedData.updateQuery = await resolveHandler(settings.updateQuery, req, data[settings.findFieldName], data, sharedData, sharedData.updateQuery);
        }

        let docData;
		
        try {
            docData = await settings.checker(req, data[settings.modifiedFieldName], data, sharedData);
        } catch (error) {
            console.log("Error from checker:", error);
            if (error instanceof GenezisGeneralError) {
                await settings.onError(error, req, data, sharedData);
            }

            throw error;
        }

        const collection = await getCollection(settings.collection, req, data, sharedData);

        if (req.checkIfUniqueCall) req.checkIfUniqueCall();

        let result;
        try {
            result = await collection.updateOne(sharedData.updateQuery, docData);
        } catch (error) {
            throw new RequestError(500, error.message, error);
        }

        if (result.modifiedCount != 1) await settings.onError(
            new GenezisGeneralError(Errors.NO_MODIFIED_DOC), 
            req, 
            data, 
            sharedData
        );

        if (settings.afterUpdated) {
            await settings.afterUpdated(req, data, sharedData, result);
        }

        await onSuccess({});
    });
}

export const SingleAdderConfig = {
    ...getBaseGenezisConfig(),
    checker: GenezisChecker.required().function(),
    returnDocField: GenezisChecker.string(),
    returnTheNewDoc: GenezisChecker.boolean(),
    afterInserted: GenezisChecker.function(),

    ___: GenezisChecker.onlyOneAvailable(["returnTheIDOfNewDoc", "returnTheNewDoc"])
};

/**
 * @function
 * @description Create a single setter that can add a MongoDB document
 * @exports createSingleAdder
 * @genezis genezis-utils-routers
 * 
 * @param {GenezisChecker} settings The settings for the request
 * @combineWith ":BaseGenezisConfigParams"
 * @combineWith "genezis-utils-router/createRequest.js:GenezisRulesConfigParams"
 * 
 * @returns {RequestFunction}
 * @throws {GenezisChecker} If the configuration is wrong
 */
export function createSingleAdder(settings) {
    GenezisChecker(settings, SingleAdderConfig);

    if (!settings.returnTheNewDoc) settings.returnTheNewDoc = false;

    if (!settings.onError) settings.onError = (error) => { throw error; }

    return createRequest(settings, async (req, data, onSuccess, sharedData, _1) => {
        if (!data) await settings.onError(
            new GenezisGeneralError(Errors.ADD_REQUEST__NO_USER_ADD_ENTRY),
            req,
            data,
            sharedData    
        );
        
        let doc;
        try {
            doc = await settings.checker(req, data, sharedData);
        } catch (error) {
            if (error instanceof GenezisGeneralError) {
                await settings.onError(error, req, data, sharedData);
            }

            throw error;
        }

        const collection = await getCollection(settings.collection, req, data, sharedData);

        if (req.checkIfUniqueCall) req.checkIfUniqueCall();

        if (data.request_onlyCheck) return await onSuccess({});

        let result;
        try {
            result = await collection.insertOne(doc);
        } catch (error) {
            throw new RequestError(500, error.message, error);
        }

        if (result.insertedCount != 1) await settings.onError(
            new GenezisGeneralError(Errors.NO_MODIFIED_DOC),
            req,
            data,
            sharedData
        );

        if (settings.afterInserted) {
            await settings.afterInserted(req, data, sharedData, result);
        }

        if (settings.customReturn) {
            await onSuccess(await settings.customReturn(req, data, sharedData, result.ops[0]));
        } else {
            await onSuccess(
                settings.returnTheNewDoc
                    ? result.ops[0]
                    : settings.returnDocField
                        ? result.ops[0][settings.returnDocField].toString()
                        : {}
            );
        }
    });
}

export const SingleDeleterConfig = {
    ...getBaseGenezisConfig(),
    afterDeletedRequiresDoc: GenezisChecker.boolean(),
    afterDeleted: GenezisChecker.function(),
    oneField: GenezisChecker.object({
        shape: {
            inputFieldName: GenezisChecker.string().required(),
            dbFieldName: GenezisChecker.string(),
            fieldTransformer: GenezisChecker.function(),
        }
    }),
    queryMaker: GenezisChecker.function()
};

export function createSingleDeleter(settings) {
    GenezisChecker(settings, SingleDeleterConfig);

    if (!settings.afterDeletedRequiresDoc) settings.afterDeletedRequiresDoc = false;
    if (!settings.queryMaker) {
        if (settings.oneField) {
            settings.queryMaker = (req, data, sharedData) => {
                const dbFieldName = settings.oneField.dbFieldName || settings.oneField.inputFieldName;

                return { 
                    [dbFieldName]: data[settings.oneField.inputFieldName] 
                }; 
            };
        } else {
            throw new GenezisCheckerError(GenezisCheckerErrorTypes.REQUIRED_BUT_MISSING, "queryMaker");
        }
    }

    if (!settings.onError) settings.onError = (error) => { throw error; }

    if (settings.throwErrorOnNoDocumentDeleted == undefined) settings.throwErrorOnNoDocumentDeleted = true;

    return createRequest(settings, async (req, data, onSuccess, sharedData) => {
        if (!data) throw new RequestError(400, await getMessage(settings.messageOnNoData));

        if (settings.oneField) {
            if (!data[settings.oneField.inputFieldName]) await settings.onError(
                new GenezisGeneralError(Errors.DELETE_REQUEST__NO_INPUT_FIELD_NAME),
                req,
                data,
                sharedData
            );

            if (settings.oneField.fieldTransformer) {
                data[settings.oneField.inputFieldName] = await settings.oneField.fieldTransformer(
                    data[settings.oneField.inputFieldName], req
                );
            }
        }

        if (settings.beforeDeleting) await settings.beforeDeleting(req, data, sharedData);

        const collection = await getCollection(settings.collection, req, data, sharedData);

        let result;
        try {
            result = await collection[settings.afterDeletedRequiresDoc ? "findOneAndDelete" : "deleteOne"](await settings.queryMaker(req, data, sharedData));
        } catch (error) {
            throw new RequestError(500, error.message, error);
        }

        const itWorked = settings.afterDeletedRequiresDoc ? result.lastErrorObject.n == 1 : result.deletedCount == 1;

        if (!itWorked) {
            if (settings.throwErrorOnNoDocumentDeleted) await settings.onError(
                new GenezisGeneralError(Errors.DELETE_REQUEST__NO_DOCUMENT_DELETED),
                req,
                data,
                sharedData
            )
        }

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