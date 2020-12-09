import { assert, expect } from "chai";
import sinon from "sinon";
import uniqid from "uniqid";

import { ObjectID as MongoID, MongoClient } from "mongodb";
import RequestsUtils, { constructQueryFromArrayOfVariables } from "../RequestsUtils";
import RequestError from "genezis-utils-router/RequestError";

import MongoMemoryServer from "mongodb-memory-server-core";

let db;
let collection;

const ID_input = "id";
const ID_field = "_id";
const ID_errorMessage = "ID-ul este invalid";
const ID_convertFunc = RequestsUtils.VariableTypes.MongoID({ errorMessage: ID_errorMessage });
const ID_inputValue = MongoID().toString();

const messageOnNoOptions = "No options";

async function deleteAllFromCollection() {
    await collection.deleteMany({});
}

function createFakeReq(data) {
    return {
        method: "GET",
        query: data
    };
}

function createFakeRes(onAnswer) {
    return {
        json: onAnswer
    };
}

describe("genezis-utils-mongodb RequestsUtils", () => {
    before(async () => {
        const mongod = new MongoMemoryServer();

        const uri = await mongod.getConnectionString();
        const port = await mongod.getPort();
        const dbPath = await mongod.getDbPath();
        const dbName = await mongod.getDbName();

        db = (await MongoClient.connect(uri, { useNewUrlParser: true }))
            .db(dbName);
    });

    describe("constructQueryFromArrayOfVariables()", () => {
        it("success for array of 1 MongoDBRequestFields of 1 field and user sending that field", async () => {
            const query = await constructQueryFromArrayOfVariables(
                [ [ { input: ID_input, field: ID_field, convertFunc: ID_convertFunc } ] ],
                { [ID_input]: ID_inputValue },
                messageOnNoOptions
            );

            assert.isTrue(query[ID_field].equals(ID_inputValue));
        });

        it("fail for array of 1 MongoDBRequestFields of 1 field and user sending that field but wrong value", async () => {
            try {
                await constructQueryFromArrayOfVariables(
                    [ [ { input: ID_input, field: ID_field, convertFunc: ID_convertFunc } ] ],
                    { [ID_input]: "wrong" },
                    messageOnNoOptions
                );
            } catch (error) {
                assert.instanceOf(error, RequestError);
                assert.equal(error.message, ID_errorMessage);
            }
        });

        it("fail for array of 1 MongoDBRequestFields of 1 field and user not sending that field", async () => {
            try {
                await constructQueryFromArrayOfVariables(
                    [ [ { input: ID_input, field: ID_field, convertFunc: ID_convertFunc } ] ],
                    { "anotherField": "123" },
                    messageOnNoOptions
                );
            } catch (error) {
                assert.instanceOf(error, RequestError);
                assert.equal(error.message, messageOnNoOptions);
            }
        });

        it("success for array of 2 MongoDBRequestsFields of 1 field each and user sending data for 2nd MongoDBRequestsFields", async () => {
            const query = await constructQueryFromArrayOfVariables(
                [
                    [ { input: "lalala", field: "lool" } ],
                    [ { input: ID_input, field: ID_field, convertFunc: ID_convertFunc } ]
                ],
                { [ID_input]: ID_inputValue },
                messageOnNoOptions
            );

            assert.isTrue(query[ID_field].equals(ID_inputValue));
        });

        it("success for array of 2 MongoDBRequestsFields of 2 fields each and user sending data for 2nd MongoDBRequestsFields", async () => {
            const name_input = "name";
            const name_field = "name";
            const name_inputValue = "Ion";

            const query = await constructQueryFromArrayOfVariables(
                [
                    [ 
                        { input: ID_input, field: ID_field, convertFunc: ID_convertFunc },
                        { input: "lalala", field: "lool" }
                    ],
                    [ 
                        { input: ID_input, field: ID_field, convertFunc: ID_convertFunc },
                        { input: name_input, field: name_field }
                    ]
                ],
                { 
                    [ID_input]: ID_inputValue, 
                    [name_input]: name_inputValue 
                },
                messageOnNoOptions
            );

            assert.isTrue(query[ID_field].equals(ID_inputValue));
            assert.equal(query[name_field], name_inputValue);
        });
    });

    describe("createSingleGetter", () => {
        before(async () => {
            const collectionName = uniqid();
            collection = db.collection(collectionName);
            await collection.deleteMany({});
        });

        const a_field = "a";
        const messageOnUserProjectionError = "FFF";
        
        function createDoc() {
            return {
                _id: MongoID(),
                a: 20
            };
        }

        async function createSingleGetter(settings) {
            return await RequestsUtils.createSingleGetter({
                collection: collection,
                messageOnNoOptions: messageOnNoOptions,
                messageOnUserProjectionError: messageOnUserProjectionError,
                ...settings
            });
        }

        it("fail on request because `_fields` when `userProjectionAllowed=true` is not an array", async () => {
            let requestFunc = await createSingleGetter({
                getBy: [ [ { input: ID_input, field: ID_field, convertFunc: ID_convertFunc } ] ],
                userProjectionAllowed: true
            });

            let req = createFakeReq({ _fields: "wrong" });
            let res = createFakeRes(() => {});

            try {
                await requestFunc(req, res);
                return Promise.reject();
            } catch (error) {
                assert.instanceOf(error, RequestError);
                assert.equal(error.statusCode, 400);
                assert.equal(error.message, messageOnUserProjectionError);
            }
        });

        it("success on request with no [`onEmptyResponse`,`userProjectionAllowed`] and finding a document", async () => {
            let requestFunc = await createSingleGetter({
                getBy: [ [ { input: ID_input, field: ID_field, convertFunc: ID_convertFunc } ] ],
            });

            const doc = createDoc();

            await deleteAllFromCollection();
            await collection.insertOne(doc);

            let onAnswer = (data) => {
                assert.isTrue(doc[ID_field].equals(data[ID_field]));
                assert.equal(doc[a_field], data[a_field]);
            };
            
            let onAnswerSpy = sinon.spy(onAnswer);

            let req = createFakeReq({ [ID_input]: doc[ID_field].toString() });
            let res = createFakeRes(onAnswerSpy);

            await requestFunc(req, res);
            assert(onAnswerSpy.called);
        });

        it("success on request with `userProjectionAllowed`, no `onEmptyResponse` and finding a document but only one field", async () => {
            let requestFunc = await createSingleGetter({
                getBy: [ [ { input: ID_input, field: ID_field, convertFunc: ID_convertFunc } ] ],
                userProjectionAllowed: true
            });

            const doc = createDoc();

            await deleteAllFromCollection();
            await collection.insertOne(doc);

            let onAnswer = (data) => {
                assert.isTrue(doc[ID_field].equals(data[ID_field]));
                assert.isUndefined(data[a_field]);
            };
            
            let onAnswerSpy = sinon.spy(onAnswer);

            let req = createFakeReq({ [ID_input]: doc[ID_field].toString(), _fields: [ [ID_field] ] });
            let res = createFakeRes(onAnswerSpy);

            await requestFunc(req, res);
            assert(onAnswerSpy.called);
        });

        it("success on request with no `onEmptyResponse` and not finding any document", async () => {
            let requestFunc = await createSingleGetter({
                getBy: [ [ { input: ID_input, field: ID_field, convertFunc: ID_convertFunc } ] ]
            });

            await deleteAllFromCollection();

            let onAnswer = (data) => {
                assert.isNull(data);
            };
            
            let onAnswerSpy = sinon.spy(onAnswer);

            let req = createFakeReq({ [ID_input]: MongoID().toString() });
            let res = createFakeRes(onAnswerSpy);

            await requestFunc(req, res);
            assert(onAnswerSpy.called);
        });

        it("success on request with `onEmptyResponse` and not finding any document", async () => {
            const successData = "AA";

            let onEmptyResponseFunc = async (req, data, onSuccess) => {
                await onSuccess(successData);
            };
            onEmptyResponseFunc.stopAfter = true;

            let onEmptyResponseFuncSpy = sinon.spy(onEmptyResponseFunc);

            let requestFunc = await createSingleGetter({
                getBy: [ [ { input: ID_input, field: ID_field, convertFunc: ID_convertFunc } ] ],
                onEmptyResponse: [
                    onEmptyResponseFuncSpy
                ]
            });

            await deleteAllFromCollection();

            let onAnswer = (data) => {
                assert.strictEqual(data, successData);
            };
            
            let onAnswerSpy = sinon.spy(onAnswer);

            let req = createFakeReq({ [ID_input]: MongoID().toString() });
            let res = createFakeRes(onAnswerSpy);

            await requestFunc(req, res);
            assert(onEmptyResponseFuncSpy.called);
            assert(onAnswerSpy.called);
        });
    });

    describe("createSingleSetter", () => {
        before(async () => {
            const collectionName = uniqid();
            collection = db.collection(collectionName);
            await collection.deleteMany({});
        });

        const messageOnNoModifiedDoc = "FFF";
        const messageOnNoUserModifiedEntry = "AAA";
        const messageOnNoUserFindEntry = "BBB";
        const a_field = "a";

        async function createSingleSetter(settings) {
            return await RequestsUtils.createSingleSetter({
                collection: collection,
                messageOnNoOptions: messageOnNoOptions,
                messageOnNoModifiedDoc: messageOnNoModifiedDoc,
                messageOnNoUserModifiedEntry: messageOnNoUserModifiedEntry,
                messageOnNoUserFindEntry: messageOnNoUserFindEntry,
                ...settings
            });
        }

        function createDoc() {
            return {
                _id: MongoID(),
                [a_field]: 20
            };
        }

        it("fail because no `modified` in user data", async () => {
            let requestFunc = await createSingleSetter({
                updateBy: [ [ { input: ID_input, field: ID_field, convertFunc: ID_convertFunc } ] ],
                checker: () => {}
            });

            let req = createFakeReq({
                find: { [ID_input]: 123 }
            });
            let res = createFakeRes(() => {});

            try {
                await requestFunc(req, res);
                return Promise.reject();
            } catch (error) {
                assert.instanceOf(error, RequestError);
                assert.equal(error.statusCode, 400);
                assert.equal(error.message, messageOnNoUserModifiedEntry);
            }
        });

        it("fail because no `modified` in user data", async () => {
            let requestFunc = await createSingleSetter({
                updateBy: [ [ { input: ID_input, field: ID_field, convertFunc: ID_convertFunc } ] ],
                checker: () => {}
            });

            let req = createFakeReq({
                modified: { [a_field]: 1 }
            });
            let res = createFakeRes(() => {});

            try {
                await requestFunc(req, res);
                return Promise.reject();
            } catch (error) {
                assert.instanceOf(error, RequestError);
                assert.equal(error.statusCode, 400);
                assert.equal(error.message, messageOnNoUserFindEntry);
            }
        });

        it("success on request updating a document", async () => {
            const doc = createDoc();

            await deleteAllFromCollection();
            await collection.insertOne(doc);

            let userSendData = {
                find: { [ID_input]: doc[ID_field] },
                modified: { [a_field]: 1 }
            };

            let checkerFunc = (data) => {
                assert.strictEqual(data, userSendData.modified);

                return {
                    $set: { [a_field]: data[a_field] + 1 }
                }
            }

            let requestFunc = await createSingleSetter({
                updateBy: [ [ { input: ID_input, field: ID_field, convertFunc: ID_convertFunc } ] ],
                checker: checkerFunc
            });

            let onAnswer = (data) => {};
            let onAnswerSpy = sinon.spy(onAnswer);

            let req = createFakeReq(userSendData);
            let res = createFakeRes(onAnswerSpy);

            await requestFunc(req, res);
            assert(onAnswerSpy.called);

            const resultDoc = await collection.findOne({ _id: doc._id });
            assert.equal(resultDoc[a_field], 2);
        });
    });

    describe("createSingleAdder", () => {
        before(async () => {
            const collectionName = uniqid();
            collection = db.collection(collectionName);
            await collection.deleteMany({});
        });

        const messageOnNoModifiedDoc = "FFF";
        const messageOnNoUserAddEntry = "AAA";
        const a_field = "a";

        async function createSingleAdder(settings) {
            return await RequestsUtils.createSingleAdder({
                collection: collection,
                messageOnNoModifiedDoc: messageOnNoModifiedDoc,
                messageOnNoUserAddEntry: messageOnNoUserAddEntry,
                ...settings
            });
        }

        it("fail because no `add` in user data", async () => {
            let requestFunc = await createSingleAdder({
                checker: () => {}
            });

            let req = createFakeReq({});
            let res = createFakeRes(() => {});

            try {
                await requestFunc(req, res);
                return Promise.reject();
            } catch (error) {
                assert.instanceOf(error, RequestError);
                assert.equal(error.statusCode, 400);
                assert.equal(error.message, messageOnNoUserAddEntry);
            }
        });

        it("success on request adding a document", async () => {
            await deleteAllFromCollection();

            const userSendData = {
                add: { rfg: 123 }
            };

            const docToBeAdded = {
                [a_field]: 345
            };

            let checkerFunc = (data) => {
                assert.strictEqual(data, userSendData.add);

                return docToBeAdded;
            }

            let requestFunc = await createSingleAdder({
                checker: checkerFunc
            });

            let onAnswer = (data) => {};
            let onAnswerSpy = sinon.spy(onAnswer);

            let req = createFakeReq(userSendData);
            let res = createFakeRes(onAnswerSpy);

            await requestFunc(req, res);
            assert(onAnswerSpy.called);

            const resultDoc = await collection.findOne({});
            assert.equal(resultDoc[a_field], docToBeAdded[a_field]);
        });

        it("success on request adding a document with `returnTheIDOfNewDoc` to `true`", async () => {
            await deleteAllFromCollection();

            const userSendData = {
                add: { rfg: 123 }
            };

            const docToBeAdded = {
                [a_field]: 345
            };

            let checkerFunc = (data) => {
                assert.strictEqual(data, userSendData.add);

                return docToBeAdded;
            }

            let requestFunc = await createSingleAdder({
                checker: checkerFunc,
                returnTheIDOfNewDoc: true
            });

            let newDocID;
            let onAnswer = (data) => {
                newDocID = data
            };
            let onAnswerSpy = sinon.spy(onAnswer);

            let req = createFakeReq(userSendData);
            let res = createFakeRes(onAnswerSpy);

            await requestFunc(req, res);
            assert(onAnswerSpy.called);

            const resultDoc = await collection.findOne({ _id: MongoID(newDocID) });
            assert.equal(resultDoc[a_field], docToBeAdded[a_field]);
        });

        it("success on request adding a document with `returnTheNewDoc` to `true`", async () => {
            await deleteAllFromCollection();

            const userSendData = {
                add: { rfg: 123 }
            };

            const docToBeAdded = {
                [a_field]: 345
            };

            let checkerFunc = (data) => {
                assert.strictEqual(data, userSendData.add);

                return docToBeAdded;
            }

            let requestFunc = await createSingleAdder({
                checker: checkerFunc,
                returnTheNewDoc: true
            });

            let newDoc;
            let onAnswer = (data) => {
                newDoc = data
            };
            let onAnswerSpy = sinon.spy(onAnswer);

            let req = createFakeReq(userSendData);
            let res = createFakeRes(onAnswerSpy);

            await requestFunc(req, res);
            assert(onAnswerSpy.called);

            const resultDoc = await collection.findOne({});
            assert.isTrue(resultDoc[ID_field].equals(newDoc[ID_field]));
            assert.equal(resultDoc[a_field], newDoc[a_field]);
        });
    });
});