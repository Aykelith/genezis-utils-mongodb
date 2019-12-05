"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

require("core-js/modules/es.symbol");

require("core-js/modules/es.array.filter");

require("core-js/modules/es.array.for-each");

require("core-js/modules/es.array.from");

require("core-js/modules/es.array.is-array");

require("core-js/modules/es.array.iterator");

require("core-js/modules/es.array.map");

require("core-js/modules/es.date.to-string");

require("core-js/modules/es.number.constructor");

require("core-js/modules/es.number.is-nan");

require("core-js/modules/es.number.parse-int");

require("core-js/modules/es.object.define-properties");

require("core-js/modules/es.object.define-property");

require("core-js/modules/es.object.get-own-property-descriptor");

require("core-js/modules/es.object.get-own-property-descriptors");

require("core-js/modules/es.object.keys");

require("core-js/modules/es.object.to-string");

require("core-js/modules/es.promise");

require("core-js/modules/es.regexp.to-string");

require("core-js/modules/es.string.iterator");

require("core-js/modules/web.dom-collections.for-each");

require("core-js/modules/web.dom-collections.iterator");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getCollection = getCollection;
exports.constructQueryFromArrayOfVariables = constructQueryFromArrayOfVariables;
exports.createSingleGetter = createSingleGetter;
exports.createMultipleGetter = createMultipleGetter;
exports.createSingleSetter = createSingleSetter;
exports.createSingleAdder = createSingleAdder;
exports.createSingleDeleter = createSingleDeleter;
exports["default"] = exports.SingleDeleterConfig = exports.SingleAdderConfig = exports.SingleSetterConfig = exports.MultipleGetterConfig = exports.SingleGetterConfig = exports.MessageGenezisConfig = exports.CollectionGenezisConfig = exports.Errors = void 0;

require("regenerator-runtime/runtime");

var _mongodb = require("mongodb");

var _RequestError = _interopRequireDefault(require("@genezis/genezis-utils-router/RequestError"));

var _createRequest = _interopRequireWildcard(require("@genezis/genezis-utils-router/createRequest"));

var _Checker = _interopRequireDefault(require("@genezis/genezis/Checker"));

var _CheckerError = _interopRequireDefault(require("@genezis/genezis/CheckerError"));

var _CheckerErrorTypes = _interopRequireDefault(require("@genezis/genezis/CheckerErrorTypes"));

var _createSearchAggregate = _interopRequireDefault(require("./createSearchAggregate"));

var _numberOfObjectsWithProperty = _interopRequireDefault(require("@genezis/genezis/utils/numberOfObjectsWithProperty"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

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
var ErrorsBase = "genezis-utils-mongodb__requestsutils";
var Errors = {
  QUERY_FROM_GIVEN_FIELDS_NOT_FOUND_MATCH: "".concat(ErrorsBase, "__query_from_given_fields_not_found_match"),
  NO_MODIFIED_DOC: "".concat(ErrorsBase, "__no_modified_doc"),
  EDIT_REQUEST__NO_USER_MODIFIED_ENTRY: "".concat(ErrorsBase, "__edit_request__no_user_modified_entry"),
  EDIT_REQUEST__NO_USER_FIND_ENTRY: "".concat(ErrorsBase, "__edit_request__no_user_find_entry"),
  ADD_REQUEST__NO_USER_ADD_ENTRY: "".concat(ErrorsBase, "__add_request__no_user_add_entry"),
  DELETE_REQUEST__NO_INPUT_FIELD_NAME: "".concat(ErrorsBase, "__delete_request__no_input_field_name")
};
exports.Errors = Errors;
var VariableTypes = {
  MongoID: function MongoID(settings) {
    (0, _Checker["default"])(settings, {
      errorCode: _Checker["default"].integer(),
      errorMessage: _Checker["default"].string().required()
    });
    if (!settings.errorCode) settings.errorCode = 400;
    return function (x) {
      if (!_mongodb.ObjectID.isValid(x)) throw new _RequestError["default"](settings.errorCode, settings.errorMessage);
      return (0, _mongodb.ObjectID)(x);
    };
  },
  Integer: function Integer(settings) {
    (0, _Checker["default"])(settings, {
      errorCode: _Checker["default"].integer(),
      errorMessage: _Checker["default"].string().required()
    });
    if (!settings.errorCode) settings.errorCode = 400;
    return function (x) {
      var n = Number.parseInt(x);
      if (Number.isNaN(n)) throw new _RequestError["default"](settings.errorCode, settings.errorMessage);
      return n;
    };
  }
};

function resolveHandler(variable) {
  var newArgs,
      _args = arguments;
  return regeneratorRuntime.async(function resolveHandler$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          if (!(typeof variable == "function")) {
            _context.next = 6;
            break;
          }

          newArgs = Array.from(_args);
          newArgs.shift();
          _context.next = 5;
          return regeneratorRuntime.awrap(variable.apply(null, newArgs));

        case 5:
          return _context.abrupt("return", _context.sent);

        case 6:
          return _context.abrupt("return", variable);

        case 7:
        case "end":
          return _context.stop();
      }
    }
  });
}

function getMessage(message, req) {
  return regeneratorRuntime.async(function getMessage$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          if (!(typeof message == "function")) {
            _context2.next = 4;
            break;
          }

          _context2.next = 3;
          return regeneratorRuntime.awrap(message(req));

        case 3:
          return _context2.abrupt("return", _context2.sent);

        case 4:
          return _context2.abrupt("return", message);

        case 5:
        case "end":
          return _context2.stop();
      }
    }
  });
}
/**
 * @description Get the collection from settings
 * @async
 * 
 * @param {MongoDB.Collection | CollectionRetrieverFunction} collection The collection given in the settings
 * @param {Request} req The request object
 */


function getCollection(collection, req, data, sharedData) {
  return regeneratorRuntime.async(function getCollection$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          if (!(typeof collection == "function")) {
            _context3.next = 4;
            break;
          }

          _context3.next = 3;
          return regeneratorRuntime.awrap(collection(req, data, sharedData));

        case 3:
          return _context3.abrupt("return", _context3.sent);

        case 4:
          return _context3.abrupt("return", collection);

        case 5:
        case "end":
          return _context3.stop();
      }
    }
  });
}
/**
 * @name OnEmptyResponseStopAfterProperty
 * @type {String}
 * @value "stopAfter"
 */


var OnEmptyResponseStopAfterProperty = "stopAfter";
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
  var stopAfter = false;

  if (array) {
    var numberOfFunctionsWithStopAfter = (0, _numberOfObjectsWithProperty["default"])(array, OnEmptyResponseStopAfterProperty, true);

    if (numberOfFunctionsWithStopAfter > 1) {
      throw new _CheckerError["default"]();
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


function constructQueryFromArrayOfVariables(array, data) {
  var query, allGood, i, length, configData, j, length2, fieldData;
  return regeneratorRuntime.async(function constructQueryFromArrayOfVariables$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          query = {};
          i = 0, length = array.length;

        case 2:
          if (!(i < length)) {
            _context4.next = 23;
            break;
          }

          configData = array[i];
          allGood = true;
          query = {};
          j = 0, length2 = configData.length;

        case 7:
          if (!(j < length2)) {
            _context4.next = 18;
            break;
          }

          fieldData = configData[j];

          if (!(data[fieldData.input] != undefined)) {
            _context4.next = 13;
            break;
          }

          query[fieldData.field] = fieldData.convertFunc ? fieldData.convertFunc(data[fieldData.input]) : data[fieldData.input];
          _context4.next = 15;
          break;

        case 13:
          allGood = false;
          return _context4.abrupt("break", 18);

        case 15:
          ++j;
          _context4.next = 7;
          break;

        case 18:
          if (!allGood) {
            _context4.next = 20;
            break;
          }

          return _context4.abrupt("break", 23);

        case 20:
          ++i;
          _context4.next = 2;
          break;

        case 23:
          if (allGood) {
            _context4.next = 25;
            break;
          }

          return _context4.abrupt("return", false);

        case 25:
          return _context4.abrupt("return", query);

        case 26:
        case "end":
          return _context4.stop();
      }
    }
  });
}
/**
 * @name CollectionGenezisConfig
 * @GenezisChecker
 * @exports CollectionGenezisConfig
 * 
 * @description The GenezisChecker for the collection
 */


var CollectionGenezisConfig = _Checker["default"].or([_Checker["default"].instanceOf(_mongodb.Collection), _Checker["default"]["function"]()]);

exports.CollectionGenezisConfig = CollectionGenezisConfig;

var MessageGenezisConfig = _Checker["default"].or([_Checker["default"].string(), _Checker["default"]["function"]()]);
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


exports.MessageGenezisConfig = MessageGenezisConfig;

function getBaseGenezisConfig() {
  return _objectSpread({
    collection: CollectionGenezisConfig.required(),
    onError: _Checker["default"]["function"]().required()
  }, _createRequest.GenezisRulesConfig);
}
/**
 * @name MongoDBRequestFieldsGenezisConfig
 * @type {GenezisChecker} 
 */


var MongoDBRequestFieldsGenezisConfig = _Checker["default"].array({
  of: _Checker["default"].array({
    of: _Checker["default"].object({
      shape: {
        input: _Checker["default"].string(),
        constValue: _Checker["default"].any(),
        field: _Checker["default"].required().string(),
        convertFunc: _Checker["default"]["function"](),
        ___: _Checker["default"].onlyOneAvailable(["input", "constValue"], {
          throwOnAllMissing: true
        })
      }
    })
  })
});

var SingleGetterConfig = _objectSpread({}, getBaseGenezisConfig(), {
  getBy: MongoDBRequestFieldsGenezisConfig,
  userProjectionAllowed: _Checker["default"]["boolean"](),
  userProjectionInputField: _Checker["default"].string(),
  customOnSuccess: _Checker["default"]["function"](),
  findQueryMiddleware: _Checker["default"]["function"](),
  customFindQueryMaker: _Checker["default"]["function"](),
  customFindOneSettings: _Checker["default"]["function"]()
});
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


exports.SingleGetterConfig = SingleGetterConfig;

function createSingleGetter(settings) {
  (0, _Checker["default"])(settings, SingleGetterConfig);

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

  return (0, _createRequest["default"])(settings, function _callee(req, data, onSuccess, sharedData) {
    var findOneSettings, i, length, findOneQuery, collection, doc;
    return regeneratorRuntime.async(function _callee$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            findOneSettings = {};

            if (!(settings.userProjectionAllowed && data[settings.userProjectionInputField])) {
              _context5.next = 7;
              break;
            }

            if (Array.isArray(data[settings.userProjectionInputField])) {
              _context5.next = 5;
              break;
            }

            _context5.next = 5;
            return regeneratorRuntime.awrap(settings.onError(new _CheckerError["default"](_CheckerErrorTypes["default"].NOT_ARRAY, settings.userProjectionInputField), req, data, sharedData));

          case 5:
            findOneSettings.projection = {};

            for (i = 0, length = data[settings.userProjectionInputField].length; i < length; ++i) {
              findOneSettings.projection[data[settings.userProjectionInputField][i]] = 1;
            }

          case 7:
            if (!settings.customFindOneSettings) {
              _context5.next = 11;
              break;
            }

            _context5.next = 10;
            return regeneratorRuntime.awrap(resolveHandler(settings.customFindOneSettings, req, data, sharedData, findOneSettings));

          case 10:
            findOneSettings = _context5.sent;

          case 11:
            if (!settings.customFindQueryMaker) {
              _context5.next = 17;
              break;
            }

            findOneQuery = settings.customFindQueryMaker(req, data, sharedData);

            if (findOneQuery) {
              _context5.next = 15;
              break;
            }

            throw new Error("The function \"customFindQueryMaker\" should return the search object");

          case 15:
            _context5.next = 29;
            break;

          case 17:
            _context5.next = 19;
            return regeneratorRuntime.awrap(constructQueryFromArrayOfVariables(settings.getBy, data));

          case 19:
            findOneQuery = _context5.sent;

            if (findOneQuery) {
              _context5.next = 23;
              break;
            }

            _context5.next = 23;
            return regeneratorRuntime.awrap(settings.onError(new _CheckerError["default"](Errors.QUERY_FROM_GIVEN_FIELDS_NOT_FOUND_MATCH), req, data, sharedData));

          case 23:
            if (!settings.findQueryMiddleware) {
              _context5.next = 29;
              break;
            }

            _context5.next = 26;
            return regeneratorRuntime.awrap(resolveHandler(settings.findQueryMiddleware, req, data, sharedData, findOneQuery));

          case 26:
            findOneQuery = _context5.sent;

            if (findOneQuery) {
              _context5.next = 29;
              break;
            }

            throw new Error("The function \"findQueryMiddleware\" should return the search object");

          case 29:
            _context5.next = 31;
            return regeneratorRuntime.awrap(getCollection(settings.collection, req, data, sharedData));

          case 31:
            collection = _context5.sent;
            _context5.prev = 32;
            _context5.next = 35;
            return regeneratorRuntime.awrap(collection.findOne(findOneQuery, findOneSettings));

          case 35:
            doc = _context5.sent;

            if (!(!doc && settings.onNoDocumentFound)) {
              _context5.next = 41;
              break;
            }

            _context5.next = 39;
            return regeneratorRuntime.awrap(settings.onNoDocumentFound(req, data, sharedData, onSuccess));

          case 39:
            if (!_context5.sent) {
              _context5.next = 41;
              break;
            }

            return _context5.abrupt("return");

          case 41:
            if (!settings.customOnSuccess) {
              _context5.next = 46;
              break;
            }

            _context5.next = 44;
            return regeneratorRuntime.awrap(settings.customOnSuccess(req, data, sharedData, onSuccess, doc));

          case 44:
            _context5.next = 48;
            break;

          case 46:
            _context5.next = 48;
            return regeneratorRuntime.awrap(onSuccess(doc));

          case 48:
            _context5.next = 55;
            break;

          case 50:
            _context5.prev = 50;
            _context5.t0 = _context5["catch"](32);

            if (!(_context5.t0 instanceof _RequestError["default"])) {
              _context5.next = 54;
              break;
            }

            throw _context5.t0;

          case 54:
            throw new _RequestError["default"](500, _context5.t0.message, _context5.t0);

          case 55:
          case "end":
            return _context5.stop();
        }
      }
    }, null, null, [[32, 50]]);
  });
}

var MultipleGetterConfig = _objectSpread({}, getBaseGenezisConfig(), {
  onEmptyResponse: _Checker["default"].array({
    of: _Checker["default"]["function"]()
  }),
  searchQueryMiddleware: _Checker["default"]["function"]()
});
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


exports.MultipleGetterConfig = MultipleGetterConfig;

function createMultipleGetter(settings) {
  (0, _Checker["default"])(settings, MultipleGetterConfig);
  var onEmptyResponseStopAfter = checkOnEmptyResponseArray(settings.onEmptyResponse);
  return (0, _createRequest["default"])(settings, function _callee2(req, data, onSuccess, sharedData) {
    var searchObject, collection, cursor, docs;
    return regeneratorRuntime.async(function _callee2$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            searchObject = (0, _createSearchAggregate["default"])(data);

            if (!settings.searchQueryMiddleware) {
              _context6.next = 5;
              break;
            }

            _context6.next = 4;
            return regeneratorRuntime.awrap(settings.searchQueryMiddleware(req, data, sharedData, searchObject));

          case 4:
            searchObject = _context6.sent;

          case 5:
            _context6.next = 7;
            return regeneratorRuntime.awrap(getCollection(settings.collection, req, data, sharedData));

          case 7:
            collection = _context6.sent;
            _context6.prev = 8;
            cursor = collection.aggregate(searchObject);
            _context6.next = 12;
            return regeneratorRuntime.awrap(cursor.toArray());

          case 12:
            docs = _context6.sent;

            if (!(docs.length == 0 && settings.onEmptyResponse)) {
              _context6.next = 18;
              break;
            }

            _context6.next = 16;
            return regeneratorRuntime.awrap(Promise.all(settings.onEmptyResponse.map(function (f) {
              return f(req, data, onSuccess);
            })));

          case 16:
            if (!onEmptyResponseStopAfter) {
              _context6.next = 18;
              break;
            }

            return _context6.abrupt("return");

          case 18:
            _context6.next = 20;
            return regeneratorRuntime.awrap(onSuccess(data.onlyCount ? docs[0] ? docs[0].number : 0 : docs));

          case 20:
            _context6.next = 27;
            break;

          case 22:
            _context6.prev = 22;
            _context6.t0 = _context6["catch"](8);

            if (!(_context6.t0 instanceof _RequestError["default"])) {
              _context6.next = 26;
              break;
            }

            throw _context6.t0;

          case 26:
            throw new _RequestError["default"](500, _context6.t0.message, _context6.t0);

          case 27:
          case "end":
            return _context6.stop();
        }
      }
    }, null, null, [[8, 22]]);
  });
}

var SingleSetterConfig = _objectSpread({}, getBaseGenezisConfig(), {
  checker: _Checker["default"].required()["function"](),
  updateBy: MongoDBRequestFieldsGenezisConfig,
  createErrorMessageForChecker: _Checker["default"]["function"](),
  modifiedFieldName: _Checker["default"].string(),
  findFieldName: _Checker["default"].string(),
  returnTheUpdatedDoc: _Checker["default"]["boolean"](),
  acceptEmptyUserInput: _Checker["default"]["boolean"](),
  updateQuery: _Checker["default"].or([_Checker["default"].object(), _Checker["default"]["function"]()]),
  afterUpdated: _Checker["default"]["function"]()
});
/**
 * @function
 * @description Create a single setter that can edit a MongoDB document
 * @exports createSingleSetter
 * @genezis genezis-utils-router
 * 
 * @param {GenezisChecker}          settings The settings for the request
 * @param {MongoDBRequestFields[]} settings.updateBy The possible fields to find the document to edit. The order of them matters
 * @param {Booelean}               settings.acceptEmptyUserInput
 * @param {Object | Function}      settings.updateQuery
 * @combineWith ":BaseGenezisConfigParams"
 * @combineWith "genezis-utils-router/createRequest.js:GenezisRulesConfigParams"
 * 
 * @returns {RequestFunction}
 * @throws {GenezisChecker} If the configuration is wrong
 */


exports.SingleSetterConfig = SingleSetterConfig;

function createSingleSetter(settings) {
  (0, _Checker["default"])(settings, SingleSetterConfig);
  if (!settings.modifiedFieldName) settings.modifiedFieldName = "modified";
  if (!settings.findFieldName) settings.findFieldName = "find";
  if (!settings.returnTheUpdatedDoc) settings.returnTheUpdatedDoc = false;
  if (!settings.acceptEmptyUserInput) settings.acceptEmptyUserInput = false;
  return (0, _createRequest["default"])(settings, function _callee3(req, data, onSuccess, sharedData) {
    var findIsEmpty, docData, collection, result;
    return regeneratorRuntime.async(function _callee3$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            if (data[settings.modifiedFieldName]) {
              _context7.next = 3;
              break;
            }

            _context7.next = 3;
            return regeneratorRuntime.awrap(settings.onError(new _CheckerError["default"](Errors.EDIT_REQUEST__NO_USER_MODIFIED_ENTRY, settings.modifiedFieldName), req, data, sharedData));

          case 3:
            findIsEmpty = !data[settings.findFieldName];

            if (!(!settings.acceptEmptyUserInput && findIsEmpty)) {
              _context7.next = 7;
              break;
            }

            _context7.next = 7;
            return regeneratorRuntime.awrap(settings.onError(new _CheckerError["default"](Errors.EDIT_REQUEST__NO_USER_FIND_ENTRY, settings.findFieldName), req, data, sharedData));

          case 7:
            sharedData.updateQuery = {};

            if (!settings.updateBy) {
              _context7.next = 15;
              break;
            }

            _context7.next = 11;
            return regeneratorRuntime.awrap(constructQueryFromArrayOfVariables(settings.updateBy, data[settings.findFieldName]));

          case 11:
            sharedData.updateQuery = _context7.sent;

            if (sharedData.updateQuery) {
              _context7.next = 15;
              break;
            }

            _context7.next = 15;
            return regeneratorRuntime.awrap(settings.onError(new _CheckerError["default"](Errors.QUERY_FROM_GIVEN_FIELDS_NOT_FOUND_MATCH), req, data, sharedData));

          case 15:
            if (!settings.updateQuery) {
              _context7.next = 19;
              break;
            }

            _context7.next = 18;
            return regeneratorRuntime.awrap(resolveHandler(settings.updateQuery, req, data[settings.findFieldName], data, sharedData, sharedData.updateQuery));

          case 18:
            sharedData.updateQuery = _context7.sent;

          case 19:
            _context7.prev = 19;
            _context7.next = 22;
            return regeneratorRuntime.awrap(settings.checker(req, data[settings.modifiedFieldName], data, sharedData));

          case 22:
            docData = _context7.sent;
            _context7.next = 32;
            break;

          case 25:
            _context7.prev = 25;
            _context7.t0 = _context7["catch"](19);
            console.log("Error from checker:", _context7.t0);

            if (!(_context7.t0 instanceof _CheckerError["default"])) {
              _context7.next = 31;
              break;
            }

            _context7.next = 31;
            return regeneratorRuntime.awrap(settings.onError(_context7.t0, req, data, sharedData));

          case 31:
            throw _context7.t0;

          case 32:
            _context7.next = 34;
            return regeneratorRuntime.awrap(getCollection(settings.collection, req, data, sharedData));

          case 34:
            collection = _context7.sent;
            _context7.prev = 35;
            _context7.next = 38;
            return regeneratorRuntime.awrap(collection.updateOne(sharedData.updateQuery, docData));

          case 38:
            result = _context7.sent;
            _context7.next = 44;
            break;

          case 41:
            _context7.prev = 41;
            _context7.t1 = _context7["catch"](35);
            throw new _RequestError["default"](500, _context7.t1.message, _context7.t1);

          case 44:
            if (!(result.modifiedCount != 1)) {
              _context7.next = 47;
              break;
            }

            _context7.next = 47;
            return regeneratorRuntime.awrap(settings.onError(new _CheckerError["default"](Errors.NO_MODIFIED_DOC), req, data, sharedData));

          case 47:
            if (!settings.afterUpdated) {
              _context7.next = 50;
              break;
            }

            _context7.next = 50;
            return regeneratorRuntime.awrap(settings.afterUpdated(req, data, sharedData, result));

          case 50:
            _context7.next = 52;
            return regeneratorRuntime.awrap(onSuccess({}));

          case 52:
          case "end":
            return _context7.stop();
        }
      }
    }, null, null, [[19, 25], [35, 41]]);
  });
}

var SingleAdderConfig = _objectSpread({}, getBaseGenezisConfig(), {
  checker: _Checker["default"].required()["function"](),
  returnDocField: _Checker["default"].string(),
  returnTheNewDoc: _Checker["default"]["boolean"](),
  afterInserted: _Checker["default"]["function"](),
  ___: _Checker["default"].onlyOneAvailable(["returnTheIDOfNewDoc", "returnTheNewDoc"])
});
/**
 * @function
 * @description Create a single setter that can add a MongoDB document
 * @exports createSingleAdder
 * @genezis genezis-utils-router
 * 
 * @param {GenezisChecker} settings The settings for the request
 * @combineWith ":BaseGenezisConfigParams"
 * @combineWith "genezis-utils-router/createRequest.js:GenezisRulesConfigParams"
 * 
 * @returns {RequestFunction}
 * @throws {GenezisChecker} If the configuration is wrong
 */


exports.SingleAdderConfig = SingleAdderConfig;

function createSingleAdder(settings) {
  (0, _Checker["default"])(settings, SingleAdderConfig);
  if (!settings.returnTheNewDoc) settings.returnTheNewDoc = false;
  return (0, _createRequest["default"])(settings, function _callee4(req, data, onSuccess, sharedData) {
    var doc, collection, result;
    return regeneratorRuntime.async(function _callee4$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            if (data) {
              _context8.next = 3;
              break;
            }

            _context8.next = 3;
            return regeneratorRuntime.awrap(settings.onError(new _CheckerError["default"](Errors.ADD_REQUEST__NO_USER_ADD_ENTRY), req, data, sharedData));

          case 3:
            _context8.prev = 3;
            _context8.next = 6;
            return regeneratorRuntime.awrap(settings.checker(req, data, sharedData));

          case 6:
            doc = _context8.sent;
            _context8.next = 15;
            break;

          case 9:
            _context8.prev = 9;
            _context8.t0 = _context8["catch"](3);

            if (!(_context8.t0 instanceof _CheckerError["default"])) {
              _context8.next = 14;
              break;
            }

            _context8.next = 14;
            return regeneratorRuntime.awrap(settings.onError(_context8.t0, req, data, sharedData));

          case 14:
            throw _context8.t0;

          case 15:
            _context8.next = 17;
            return regeneratorRuntime.awrap(getCollection(settings.collection, req, data, sharedData));

          case 17:
            collection = _context8.sent;
            _context8.prev = 18;
            _context8.next = 21;
            return regeneratorRuntime.awrap(collection.insertOne(doc));

          case 21:
            result = _context8.sent;
            _context8.next = 27;
            break;

          case 24:
            _context8.prev = 24;
            _context8.t1 = _context8["catch"](18);
            throw new _RequestError["default"](500, _context8.t1.message, _context8.t1);

          case 27:
            if (!(result.insertedCount != 1)) {
              _context8.next = 30;
              break;
            }

            _context8.next = 30;
            return regeneratorRuntime.awrap(settings.onError(new _CheckerError["default"](Errors.NO_MODIFIED_DOC), req, data, sharedData));

          case 30:
            if (!settings.afterInserted) {
              _context8.next = 33;
              break;
            }

            _context8.next = 33;
            return regeneratorRuntime.awrap(settings.afterInserted(req, data, sharedData, result));

          case 33:
            if (!settings.customReturn) {
              _context8.next = 44;
              break;
            }

            _context8.t2 = regeneratorRuntime;
            _context8.t3 = onSuccess;
            _context8.next = 38;
            return regeneratorRuntime.awrap(settings.customReturn(req, data, sharedData, result.ops[0]));

          case 38:
            _context8.t4 = _context8.sent;
            _context8.t5 = (0, _context8.t3)(_context8.t4);
            _context8.next = 42;
            return _context8.t2.awrap.call(_context8.t2, _context8.t5);

          case 42:
            _context8.next = 46;
            break;

          case 44:
            _context8.next = 46;
            return regeneratorRuntime.awrap(onSuccess(settings.returnTheNewDoc ? result.ops[0] : settings.returnDocField ? result.ops[0][settings.returnDocField].toString() : {}));

          case 46:
          case "end":
            return _context8.stop();
        }
      }
    }, null, null, [[3, 9], [18, 24]]);
  });
}

var SingleDeleterConfig = _objectSpread({}, getBaseGenezisConfig(), {
  afterDeletedRequiresDoc: _Checker["default"]["boolean"](),
  afterDeleted: _Checker["default"]["function"](),
  oneField: _Checker["default"].object({
    shape: {
      inputFieldName: _Checker["default"].string().required(),
      dbFieldName: _Checker["default"].string(),
      fieldTransformer: _Checker["default"]["function"]()
    }
  }),
  queryMaker: _Checker["default"]["function"]()
});

exports.SingleDeleterConfig = SingleDeleterConfig;

function createSingleDeleter(settings) {
  (0, _Checker["default"])(settings, SingleDeleterConfig);
  if (!settings.afterDeletedRequiresDoc) settings.afterDeletedRequiresDoc = false;

  if (!settings.queryMaker) {
    if (settings.oneField) {
      settings.queryMaker = function (req, data, sharedData) {
        var dbFieldName = settings.oneField.dbFieldName || settings.oneField.inputFieldName;
        return _defineProperty({}, dbFieldName, data[settings.oneField.inputFieldName]);
      };
    } else {
      throw new _CheckerError["default"](_CheckerErrorTypes["default"].REQUIRED_BUT_MISSING, "queryMaker");
    }
  }

  return (0, _createRequest["default"])(settings, function _callee5(req, data, onSuccess, sharedData) {
    var collection, result;
    return regeneratorRuntime.async(function _callee5$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            if (data) {
              _context9.next = 6;
              break;
            }

            _context9.t0 = _RequestError["default"];
            _context9.next = 4;
            return regeneratorRuntime.awrap(getMessage(settings.messageOnNoData));

          case 4:
            _context9.t1 = _context9.sent;
            throw new _context9.t0(400, _context9.t1);

          case 6:
            if (!settings.oneField) {
              _context9.next = 14;
              break;
            }

            if (data[settings.oneField.inputFieldName]) {
              _context9.next = 10;
              break;
            }

            _context9.next = 10;
            return regeneratorRuntime.awrap(settings.onError(new _CheckerError["default"](Errors.DELETE_REQUEST__NO_INPUT_FIELD_NAME), req, data, sharedData));

          case 10:
            if (!settings.oneField.fieldTransformer) {
              _context9.next = 14;
              break;
            }

            _context9.next = 13;
            return regeneratorRuntime.awrap(settings.oneField.fieldTransformer(data[settings.oneField.inputFieldName], req));

          case 13:
            data[settings.oneField.inputFieldName] = _context9.sent;

          case 14:
            _context9.next = 16;
            return regeneratorRuntime.awrap(getCollection(settings.collection, req, data, sharedData));

          case 16:
            collection = _context9.sent;
            _context9.prev = 17;
            _context9.t2 = regeneratorRuntime;
            _context9.t3 = collection;
            _context9.t4 = settings.afterDeletedRequiresDoc ? "findOneAndDelete" : "deleteOne";
            _context9.next = 23;
            return regeneratorRuntime.awrap(settings.queryMaker(req, data, sharedData));

          case 23:
            _context9.t5 = _context9.sent;
            _context9.t6 = _context9.t3[_context9.t4].call(_context9.t3, _context9.t5);
            _context9.next = 27;
            return _context9.t2.awrap.call(_context9.t2, _context9.t6);

          case 27:
            result = _context9.sent;
            _context9.next = 33;
            break;

          case 30:
            _context9.prev = 30;
            _context9.t7 = _context9["catch"](17);
            throw new _RequestError["default"](500, _context9.t7.message, _context9.t7);

          case 33:
            if (!settings.afterDeleted) {
              _context9.next = 36;
              break;
            }

            _context9.next = 36;
            return regeneratorRuntime.awrap(settings.afterDeleted(req, data, sharedData, result.value));

          case 36:
            _context9.next = 38;
            return regeneratorRuntime.awrap(onSuccess({}));

          case 38:
          case "end":
            return _context9.stop();
        }
      }
    }, null, null, [[17, 30]]);
  });
}

function notFoundOnEmptyResponse(message) {
  var f = function f(onSuccess) {
    throw new _RequestError["default"](404, message);
  };

  f.stopAfter = true;
  return f;
}

var _default = {
  createSingleGetter: createSingleGetter,
  createSingleSetter: createSingleSetter,
  createSingleAdder: createSingleAdder,
  createMultipleGetter: createMultipleGetter,
  createSingleDeleter: createSingleDeleter,
  SingleGetterConfig: SingleGetterConfig,
  MultipleGetterConfig: MultipleGetterConfig,
  SingleSetterConfig: SingleSetterConfig,
  SingleAdderConfig: SingleAdderConfig,
  VariableTypes: VariableTypes,
  notFoundOnEmptyResponse: notFoundOnEmptyResponse
};
exports["default"] = _default;