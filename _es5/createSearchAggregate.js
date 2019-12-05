"use strict";

require("core-js/modules/es.symbol");

require("core-js/modules/es.symbol.description");

require("core-js/modules/es.symbol.iterator");

require("core-js/modules/es.array.is-array");

require("core-js/modules/es.array.iterator");

require("core-js/modules/es.array.sort");

require("core-js/modules/es.number.constructor");

require("core-js/modules/es.number.is-nan");

require("core-js/modules/es.object.assign");

require("core-js/modules/es.object.define-property");

require("core-js/modules/es.object.keys");

require("core-js/modules/es.object.to-string");

require("core-js/modules/es.parse-int");

require("core-js/modules/es.regexp.exec");

require("core-js/modules/es.string.iterator");

require("core-js/modules/es.string.search");

require("core-js/modules/web.dom-collections.iterator");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _mongodb = require("mongodb");

var _SearchAggregateValueType = _interopRequireDefault(require("./data/SearchAggregateValueType"));

var _SearchAggregateSearchType = _interopRequireDefault(require("./data/SearchAggregateSearchType"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/**
 * Convert a string value to its type
 * 
 * @param {String} type the type of the value to convert to, from SearchAggregateValueType
 * @param {String} value the value for conversion
 * 
 * @returns {Any} the converted value, or string value  
 */
function convertSearchType(type, value) {
  switch (type) {
    case _SearchAggregateValueType["default"].INTEGER:
      return parseInt(value);

    case _SearchAggregateValueType["default"].MONGOID:
      return (0, _mongodb.ObjectID)(value);

    case _SearchAggregateValueType["default"].BOOL:
      return _typeof(value) == _typeof(true) && value || value == "true";
  }

  return value;
}
/**
 * Create a search query for a specific field
 * 
 * @param {String} fieldName the field name 
 * @param {Object|Object[]} data the data for the search query, array of objects if the field name is `$or` or `$and` 
 * @param {String} [data.type] if type of the search
 * @param {String} [data.valueType] // TODO: specifications
 * @param {Number} data.value the value specific for every type of search
 * 
 * @returns {Object} the search object for the specified field
 * @throws {WRONG_PARAMS}
 * 
 * @example
 * { type: BIGGER_THAN, value: 10 }
 * 
 * @example
 * { type: RANGE, value: { $lte: 20, $gte: 10 } }
 * 
 * @example
 * { type: IN_NUMBERS, value: [10, 20, 30] }
 * 
 * @example
 * { type: REGEX, value: "^[a,b]rr", $options: "g" }
 */


function generateQuery(fieldName, data) {
  // TODO: Checkings for fieldName
  if (fieldName == "$or" || fieldName == "$and") {
    var query = [];

    for (var j = 0, length2 = data.length; j < length2; ++j) {
      var keys = Object.keys(data[j]);
      query.push(_defineProperty({}, keys[0], generateQuery(keys[0], data[j][keys[0]])));
    }

    return query;
  }

  if (data.value == null) {
    throw new WrongParamsError("'data' must contains the value", {
      n: 0,
      data: data
    });
  }

  if ((data.type == _SearchAggregateSearchType["default"].IN_MONGOIDS || data.type == _SearchAggregateSearchType["default"].IN_NUMBERS || data.type == _SearchAggregateSearchType["default"].IN_STRINGS) && !Array.isArray(data.value)) {
    throw new WrongParamsError("'data.value' must be an array", {
      n: 2,
      type: data.type
    });
  }

  if (data.type == _SearchAggregateSearchType["default"].BIGGER_THAN) {
    return {
      $gte: parseInt(data.value)
    };
  } else if (data.type == _SearchAggregateSearchType["default"].SMALLER_THAN) {
    return {
      $lte: parseInt(data.value)
    };
  } else if (data.type == _SearchAggregateSearchType["default"].RANGE) {
    var _query = {};
    if (data.value.$lte) _query.$lte = parseInt(data.value.$lte);
    if (data.value.$gte) _query.$gte = parseInt(data.value.$gte);
    return _query;
  } else if (!data.type) {
    return convertSearchType(data.valueType, data.value);
  } else if (data.type == _SearchAggregateSearchType["default"].IN_MONGOIDS) {
    var array = [];

    for (var _j = 0, _length = data.value.length; _j < _length; ++_j) {
      array.push((0, _mongodb.ObjectID)(data.value[_j]));
    }

    return _defineProperty({}, data.notIn ? "$nin" : "$in", array);
  } else if (data.type == _SearchAggregateSearchType["default"].IN_NUMBERS) {
    var _array = []; // TODO: Maybe check if is not NaN the numbers

    for (var _j2 = 0, _length2 = data.value.length; _j2 < _length2; ++_j2) {
      _array.push(parseInt(data.value[_j2]));
    }

    return _defineProperty({}, data.notIn ? "$nin" : "$in", _array);
  } else if (data.type == _SearchAggregateSearchType["default"].IN_STRINGS) {
    var _array2 = [];

    for (var _j3 = 0, _length3 = data.value.length; _j3 < _length3; ++_j3) {
      _array2.push(data.value[_j3]);
    }

    return _defineProperty({}, data.notIn ? "$nin" : "$in", _array2);
  } else if (data.type == _SearchAggregateSearchType["default"].REGEX) {
    var obj = {
      $regex: data.value
    };
    if (data.options) obj.$options = data.options;
    return obj;
  }

  throw new WrongParamsError("Type is invalid", {
    n: 2,
    type: data.type
  });
}
/**
 * Create the MongoDB aggregate object from the given data
 * 
 * @param {Object} queryData the data from where to create the aggregate object
 * @param {Object} [queryData.sort]
 * @param {String[]} [queryData.projection] the fields to get
 * @param {Object[]} [queryData.search] the search configurations
 * @param {Object} [queryData.range] the range of the documents to get
 * @param {Number} [queryData.range.x] the starting index, positive number
 * @param {Number} [queryData.range.y] the ending index, positive number bigger than `queryData.range.x`(if present)
 * @param {bool} [queryData.onlyCount] only to count the documents
 * @param {Object} [preAggregateData] the pre data for the agreggate object. No checks are made if the data in `preAggregateData` is valid
 * @param {Object} [preAggregateData.$match] the $match object
 * @param {Object} [preAggregateData.$sort] the $sort object
 * @param {Object} [preAggregateData.$projection] the $projection object
 * 
 * @returns {Object} the aggregate object
 * @throws {WRONG_PARAMS}
 */


var _default = function _default(queryData) {
  var preAggregateData = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var searchObject = [{
    $match: preAggregateData.$match || {}
  }];
  if (preAggregateData.$sort) searchObject.push({
    $sort: preAggregateData.$sort
  }); // TODO: Properly

  if (queryData.sort) {
    if (!preAggregateData.$sort) searchObject.push({
      $sort: {}
    }); // TODO: Multiple fields sorting

    var field = Object.keys(queryData.sort)[0];
    searchObject[1].$sort = _defineProperty({}, field, parseInt(queryData.sort[field]));
  }

  if (queryData.onlyPublish) searchObject[0]["$match"]["promotions.own.normal"] = true; // <= TODO: Delete it

  if (preAggregateData.$project) searchObject.push({
    $project: preAggregateData.$project
  }); // Fields to get

  if (queryData.projection) {
    if (!Array.isArray(queryData.projection)) {
      console.log(queryData);
      throw new WrongParamsError("'projection' must be an array", {
        n: 0
      });
    }

    var projection = {};

    for (var i = 0, length = queryData.projection.length; i < length; ++i) {
      projection[queryData.projection[i]] = 1;
    }

    if (preAggregateData.$project) Object.assign(searchObject[searchObject.length - 1].$project, projection);else searchObject.push({
      $project: projection
    });
  }

  if (queryData.search) {
    var fields = Object.keys(queryData.search);

    for (var _i = 0, _length4 = fields.length; _i < _length4; ++_i) {
      var data = queryData.search[fields[_i]];
      if (!data) continue;
      searchObject[0]["$match"][fields[_i]] = generateQuery(fields[_i], data);
    }
  }

  if (queryData.range) {
    var x = parseInt(queryData.range.x);

    if (queryData.range.x) {
      if (Number.isNaN(x) || x < 0) {
        throw new WrongParamsError("'range.x' must be a valid positive integer", {
          n: 1
        });
      }
    } else {
      x = 0;
    }

    if (x != 0) searchObject.push({
      $skip: x
    });
    var y = parseInt(queryData.range.y);

    if (Number.isNaN(y) || y < x) {
      throw new WrongParamsError("'range.y' must be a valid positive integer and bigger than 'range.x'(if present)", {
        n: 1
      });
    }

    searchObject.push({
      $limit: y - x
    });
  }

  if (queryData.onlyCount) {
    searchObject[2] = {
      $count: "number"
    };
  }

  return searchObject;
};

exports["default"] = _default;