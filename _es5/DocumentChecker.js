"use strict";

require("core-js/modules/es.symbol");

require("core-js/modules/es.symbol.description");

require("core-js/modules/es.symbol.iterator");

require("core-js/modules/es.array.concat");

require("core-js/modules/es.array.for-each");

require("core-js/modules/es.array.includes");

require("core-js/modules/es.array.is-array");

require("core-js/modules/es.array.iterator");

require("core-js/modules/es.array.map");

require("core-js/modules/es.date.to-string");

require("core-js/modules/es.number.constructor");

require("core-js/modules/es.number.is-integer");

require("core-js/modules/es.number.is-nan");

require("core-js/modules/es.number.parse-int");

require("core-js/modules/es.object.assign");

require("core-js/modules/es.object.define-property");

require("core-js/modules/es.object.keys");

require("core-js/modules/es.object.to-string");

require("core-js/modules/es.promise");

require("core-js/modules/es.string.includes");

require("core-js/modules/es.string.iterator");

require("core-js/modules/web.dom-collections.for-each");

require("core-js/modules/web.dom-collections.iterator");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.Errors = void 0;

require("regenerator-runtime/runtime");

var _Checker = require("@genezis/genezis/Checker");

var _mongodb = require("mongodb");

var _CheckerError = _interopRequireDefault(require("@genezis/genezis/CheckerError"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var Errors = {
  NOT_UNIQUE: "genezis-utils-mongodb_documentchecker_not_unique"
};
exports.Errors = Errors;
var generateOptions = (0, _Checker.createGenerateOptions)(function (generateOptions, previousChecks) {
  return {
    id: function id(settings) {
      return generateOptions(previousChecks.concat([function (property, data, config, field, document) {
        if (data === undefined) return;
        if (!_mongodb.ObjectID.isValid(data)) throw new _CheckerError["default"]("The property \"".concat(property, "\" with data \"").concat(data, "\" is not a valid MongoID"), property, data);

        if (!settings.convert && !(data instanceof _mongodb.ObjectID)) {
          throw new _CheckerError["default"]("5", property, data);
        }

        if (document) document[field] = (0, _mongodb.ObjectID)(data);
      }]));
    },
    int32: function int32(settings) {
      return generateOptions(previousChecks.concat([function (property, data, config, field, document) {
        if (data === undefined) return;
        var isInteger = Number.isInteger(data);

        if (!isInteger) {
          if (settings.convert) {
            var converted = Number.parseInt(data);
            if (Number.isNaN(converted)) throw new _CheckerError["default"]("The property \"".concat(property, "\" with value \"").concat(data, "\" must be a number"), property, data);
          } else {
            throw new _CheckerError["default"]("The property \"".concat(property, "\" with value \"").concat(data, "\" must be an integer"), property, data);
          }
        }

        if (document) document[field] = (0, _mongodb.Int32)(data);
      }]));
    },
    int64: function int64(settings) {
      return generateOptions(previousChecks.concat([function (property, data, config, field, document) {
        if (data === undefined) return;
        var isInteger = Number.isInteger(data);

        if (!isInteger) {
          if (settings.convert) {
            var converted = Number.parseInt(data);
            if (Number.isNaN(converted)) throw new _CheckerError["default"]("The property \"".concat(property, "\" with value \"").concat(data, "\" must be a number"), property, data);
          } else {
            throw new _CheckerError["default"]("The property \"".concat(property, "\" with value \"").concat(data, "\" must be an integer"), property, data);
          }
        }

        if (document) document[field] = _mongodb.Long.fromNumber(data);
      }]));
    },
    date: function date() {
      var settings = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      return generateOptions(previousChecks.concat([function (property, data, config, field, document) {
        if (data === undefined) return;

        if (!(data instanceof Date)) {
          console.log("LOOOOL");
          var isInteger = Number.isInteger(data);

          if (!isInteger) {
            if (settings.convert) {
              var converted = Number.parseInt(data);
              if (Number.isNaN(converted)) throw new _CheckerError["default"]("The property \"".concat(property, "\" with value \"").concat(data, "\" must be a Date or a number"), property, data);
              data = new Date(converted);
            } else {
              throw new _CheckerError["default"]("The property \"".concat(property, "\" with value \"").concat(data, "\" must be a Date or a number"), property, data);
            }
          }

          data = new Date(data);
        }

        if (document) document[field] = data;
      }]));
    },
    "float": function float(settings) {
      return generateOptions(previousChecks.concat([function (property, data, config, field, document, collection, runtimeSettings) {
        if (config[property] !== undefined) {
          var value = (0, _Checker.numberChecker)(settings)(property, data, config, runtimeSettings);
          if (document) document[field] = value;
        }
      }]));
    },
    unique: function unique(settings) {
      return generateOptions(previousChecks.concat([function _callee(property, data, config, field, document, collection, runtimeSettings) {
        var resultDoc, i, length;
        return regeneratorRuntime.async(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!runtimeSettings.__ignoreUnique) {
                  _context.next = 2;
                  break;
                }

                return _context.abrupt("return");

              case 2:
                if (!(data === undefined)) {
                  _context.next = 4;
                  break;
                }

                return _context.abrupt("return");

              case 4:
                if (collection) {
                  _context.next = 6;
                  break;
                }

                throw new Error("No collection given");

              case 6:
                _context.next = 8;
                return regeneratorRuntime.awrap(collection.findOne(_defineProperty({}, field, data), {
                  $projection: {
                    _id: 1
                  }
                }));

              case 8:
                resultDoc = _context.sent;

                if (!resultDoc) {
                  _context.next = 21;
                  break;
                }

                if (!(runtimeSettings[property] && runtimeSettings[property].ignoreDocumentsWithIDs)) {
                  _context.next = 20;
                  break;
                }

                i = 0, length = runtimeSettings[property].ignoreDocumentsWithIDs.length;

              case 12:
                if (!(i < length)) {
                  _context.next = 18;
                  break;
                }

                if (!resultDoc._id.equals(runtimeSettings[property].ignoreDocumentsWithIDs)) {
                  _context.next = 15;
                  break;
                }

                throw new _CheckerError["default"]("", property, data);

              case 15:
                ++i;
                _context.next = 12;
                break;

              case 18:
                _context.next = 21;
                break;

              case 20:
                throw new _CheckerError["default"](Errors.NOT_UNIQUE, property, data);

              case 21:
              case "end":
                return _context.stop();
            }
          }
        });
      }]));
    },
    string: function string(settings) {
      return generateOptions(previousChecks.concat([function (property, data, config, field, document, collection, runtimeSettings) {
        if (config[property]) {
          var value = (0, _Checker.stringChecker)(settings)(property, data, {}, runtimeSettings);
          if (document) document[field] = value;
        }
      }]));
    },
    object: function object() {
      var settings = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      return generateOptions(previousChecks.concat([function (property, value, config, field, document, collection, runtimeSettings) {
        if (value === undefined) return;
        if (_typeof(value) !== "object" || Array.isArray(value)) throw new _CheckerError["default"]("The property \"".concat(property, "\" with value \"").concat(value, "\" must be an object"), property, value);

        if (settings.keysOf) {
          Object.keys(value).forEach(function (key) {
            settings.keysOf._.forEach(function (checker) {
              return checker(key, key, _defineProperty({}, key, true), null, null, null, runtimeSettings);
            });
          });
        }

        if (settings.hasOwnProperty("valueOf")) {
          console.log(property, settings.valueOf, Object.keys(settings));
          Object.keys(value).forEach(function (key) {
            settings.valueOf._.forEach(function (checker) {
              return checker(key, value[key], value, key, value, collection, runtimeSettings);
            });
          });
        }

        document[field] = {};

        if (settings.shape) {
          Object.keys(settings.shape).forEach(function (subproperty) {
            settings.shape[subproperty].type._.forEach(function (checker) {
              return checker(subproperty, value[subproperty], value, settings.shape[subproperty].field, document[field], collection, runtimeSettings);
            });
          });
        } else {
          document[field] = value;
        }
      }]));
    },
    integer: function integer(settings) {
      return generateOptions(previousChecks.concat([function (property, data, config, field, document, collection, runtimeSettings) {
        if (config[property] !== undefined) {
          var value = (0, _Checker.integerChecker)(settings)(property, data, config, runtimeSettings);
          if (document != null) document[field] = value;
        }
      }]));
    },
    "boolean": function boolean(settings) {
      return generateOptions(previousChecks.concat([function (property, data, config, field, document, collection, runtimeSettings) {
        if (config[property]) {
          var value = (0, _Checker.booleanChecker)(settings)(property, data, config, runtimeSettings);
          if (document != null) document[field] = value;
        }
      }]));
    },
    "default": function _default(defaultValue) {
      return generateOptions(previousChecks.concat([function (property, data, config, field, document, collection, runtimeSettings) {
        if (runtimeSettings.___ignoreDefault) return;

        if (data === undefined) {
          document[field] = defaultValue;
        }
      }]));
    },
    required: function required(settings) {
      return generateOptions(previousChecks.concat([function (property, data, config, field, document, collection, runtimeSettings) {
        if (runtimeSettings.___ignoreRequired) return;
        (0, _Checker.requiredChecker)(settings)(property, data, config, runtimeSettings);
      }]));
    },
    array: function array() {
      var settings = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      return generateOptions(previousChecks.concat([function (property, data, config, field, document, collection, runtimeSettings) {
        if (data === undefined) return;
        if (!Array.isArray(data)) throw new _CheckerError["default"]("The property \"".concat(property, "\" with value \"").concat(data, "\" must be an array"), property, data);

        if (settings.onCopies) {
          var arrayWithoutCopies = [];

          var isUniqueFunc = settings.onCopies.isUniqueFunc || function (value, array) {
            return !array.includes(value);
          };

          if (settings.onCopies.checkBefore) {
            data.forEach(function (child) {
              if (isUniqueFunc(child, arrayWithoutCopies)) arrayWithoutCopies.push(child);else {
                if (!settings.onCopies["delete"]) {
                  throw new _CheckerError["default"]("1", property, data);
                }
              }
            });
          } else if (!settings.onCopies.checkAfter) {
            throw new _CheckerError["default"]("2", property, data);
          }

          data = arrayWithoutCopies;
        }

        if (settings.valuesFrom) {
          var isFromArrayFunc = settings.valuesIsFromArrayFunc || function (e, valuesFrom) {
            return valuesFrom.includes(e);
          };

          data.forEach(function (child, index) {
            if (!isFromArrayFunc(child, settings.valuesFrom)) {
              throw new _CheckerError["default"]("3", "".concat(property, "[").concat(index, "]"), child);
            }
          });
        }

        document[field] = []; // console.log("(((", document, data);

        if (settings.of) {
          data.forEach(function (child, index) {
            settings.of._[0]("".concat(property, "[").concat(index, "]"), child, _defineProperty({}, "".concat(property, "[").concat(index, "]"), true), index, document[field], collection, runtimeSettings);
          });
        } else {
          document[field] = data;
        }

        if (settings.fixedLength) {
          if (document.length != settings.fixedLength) throw new _CheckerError["default"]("The property \"".concat(property, "\" has fixedLengh=").concat(settings.fixedLength, " but the size of array is ").concat(document.length), property, data);
        }
      }]));
    }
  };
});

var docMaker = function _callee2(config, configSettings, collection, runtimeSettings) {
  var document, promises;
  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          if (config) {
            _context2.next = 2;
            break;
          }

          throw new Error("No config given");

        case 2:
          if (configSettings) {
            _context2.next = 4;
            break;
          }

          throw new Error("No configSettings given");

        case 4:
          // if (!collection) throw new Error("No collection given");
          document = {};
          if (!runtimeSettings) runtimeSettings = {};
          runtimeSettings.doNotModify = true;
          promises = Object.keys(configSettings).map(function (property) {
            if (property == "__") {
              return Promise.all(configSettings[property]._.map(function (checker) {
                return checker(null, null, config, null, document, collection, runtimeSettings);
              }));
            }

            if (!configSettings[property]) throw new Error("A property is undefined");
            if (!configSettings[property].type) throw new Error("The property \"".concat(property, "\" is missing the field \"type\""));
            if (!configSettings[property].field) throw new Error("The property \"".concat(property, "\" is missing the field \"field\""));
            return Promise.all(configSettings[property].type._.map(function (checker) {
              return checker(property, config[property], config, configSettings[property].field, document, collection, runtimeSettings);
            }));
          });
          _context2.next = 10;
          return regeneratorRuntime.awrap(Promise.all(promises));

        case 10:
          return _context2.abrupt("return", document);

        case 11:
        case "end":
          return _context2.stop();
      }
    }
  });
};

Object.assign(docMaker, generateOptions());
var _default2 = docMaker;
exports["default"] = _default2;