//= Functions & Modules
// Own
import ValueType from "./data/SearchAggregateValueType";
import SearchType from "./data/SearchAggregateSearchType";
// Packages
import GenezisGeneralError from "@genezis/genezis/GenezisGeneralError";
import { ObjectID as MongoID } from "mongodb";

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
        case ValueType.INTEGER:
            return parseInt(value);

        case ValueType.MONGOID:
            return MongoID(value);

        case ValueType.BOOL:
            return (typeof(value) == typeof(true) && value) || (value == "true");

        case ValueType.STRING:
            return value.toString();

        case ValueType.DATE:
            return new Date(value);

        default:
            throw new GenezisGeneralError(`Not found the type "${type}"`);
    }
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
        let query = [];
        for (let j=0, length2=data.length; j < length2; ++j) {
            let keys = Object.keys(data[j]);

            query.push({ [ keys[0] ]: generateQuery(keys[0], data[j][keys[0]]) });
        }
        
        return query;
    }

    if (data.value == null) {
        throw new GenezisGeneralError("'data' must contains the value", { data: data });
    }

    if (
        (
            data.type == SearchType.IN_MONGOIDS ||
            data.type == SearchType.IN_NUMBERS ||
            data.type == SearchType.IN_STRINGS
        )
        &&
        !Array.isArray(data.value)
    ) {
        throw new GenezisGeneralError("'data.value' must be an array", { type: data.type });
    }
    
    if (data.type == SearchType.BIGGER_THAN) {
        let value;
        if (data.valueType != null) {
            value = convertSearchType(data.valueType, data.value);
        } else {
            value = parseInt(data.value);
        }

        return { $gte: value };
    } else if (data.type == SearchType.SMALLER_THAN) {
        let value;
        if (data.valueType != null) {
            value = convertSearchType(data.valueType, data.value);
        } else {
            value = parseInt(data.value);
        }

        return { $lte: value };
    } else if (data.type == SearchType.RANGE) {
        let query = {};
        
        if (data.value.$lte) {
            let value;
            if (data.valueType != null) {
                value = convertSearchType(data.valueType, data.value.$lte);
            } else {
                value = parseInt(data.value.$lte);
            }

            query.$lte = parseInt(value);
        }

        if (data.value.$gte) {
            let value;
            if (data.valueType != null) {
                value = convertSearchType(data.valueType, data.value.$gte);
            } else {
                value = parseInt(data.value.$gte);
            }
            
            query.$gte = parseInt(value);
        }

        return query;
    } else if (!data.type) {
        return convertSearchType(data.valueType, data.value);
    } else if (data.type == SearchType.IN_MONGOIDS) {
        let array = [];

        for (let j=0, length2 = data.value.length; j < length2; ++j) {
            array.push(MongoID(data.value[j]));
        }

        return { [data.notIn ? "$nin" : "$in"]: array };
    } else if (data.type == SearchType.IN_NUMBERS) {
        let array = [];

        // TODO: Maybe check if is not NaN the numbers
        for (let j=0, length2 = data.value.length; j < length2; ++j) {
            array.push(parseInt(data.value[j]));
        }

        return { [data.notIn ? "$nin" : "$in"]: array };
    } else if (data.type == SearchType.IN_STRINGS) {
        let array = [];

        for (let j=0, length2 = data.value.length; j < length2; ++j) {
            array.push(data.value[j]);
        }

        return { [data.notIn ? "$nin" : "$in"]: array };
    } else if (data.type == SearchType.REGEX) {
        let obj = { $regex: data.value };

        if (data.options) obj.$options = data.options;

        return obj;
    } else if (data.type == SearchType.EXISTS) {
        return { 
            $exists: 
                (typeof(data.value) == typeof(true) && data.value) || 
                (Number.isInteger(data.value) && data.value == 1) || 
                (data.value == "true") 
        };
    }

    throw new GenezisGeneralError("Type is invalid", { type: data.type });
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
export default (queryData, preAggregateData = {}) => {
    let searchObject = [
        { $match: preAggregateData.$match || {} }
    ];

    if (preAggregateData.$sort) searchObject.push({ $sort: preAggregateData.$sort });
    // TODO: Properly
    if (queryData.sort) {
        if (!preAggregateData.$sort) searchObject.push({ $sort: {} });

        // TODO: Multiple fields sorting
        const field = Object.keys(queryData.sort)[0];
        searchObject[1].$sort = { [field]: parseInt(queryData.sort[field]) };
    }

    if (preAggregateData.$project) searchObject.push({ $project: preAggregateData.$project });
    
    // Fields to get
    if (queryData.projection) {
        if (!Array.isArray(queryData.projection)) {
            console.log(queryData);
            throw new GenezisGeneralError("'projection' must be an array");
        }
        
        let projection = {};
        for (let i=0, length=queryData.projection.length; i < length; ++i) {
            projection[queryData.projection[i]] = 1;
        }

        if (preAggregateData.$project) Object.assign(searchObject[searchObject.length - 1].$project, projection);
        else                           searchObject.push({ $project: projection });
    }

    if (queryData.search) {
        let fields = Object.keys(queryData.search);
        for (let i = 0, length = fields.length; i < length; ++i) {
            let data = queryData.search[fields[i]];

            if (!data) continue;

            searchObject[0]["$match"][ fields[i] ] = generateQuery(fields[i], data);
        }
    }

    if (queryData.range) {
        let x = parseInt(queryData.range.x);
        if (queryData.range.x) {
            if (Number.isNaN(x) || x < 0) {
                throw new GenezisGeneralError("'range.x' must be a valid positive integer");
            }
        } else {
            x = 0;
        }

        if (x != 0) searchObject.push({ $skip: x });

        const y = parseInt(queryData.range.y);
        if (Number.isNaN(y) || y < x) {
            throw new GenezisGeneralError("'range.y' must be a valid positive integer and bigger than 'range.x'(if present)");
        }

        searchObject.push({ $limit: y - x });
    }

    if (queryData.onlyCount) {
        searchObject.push({ $count: "number" });
    }

    return searchObject;
};