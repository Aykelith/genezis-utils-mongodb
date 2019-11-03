import { ObjectID as MongoID } from "mongodb";

import ValueType from "./data/SearchAggregateValueType";
import SearchType from "./data/SearchAggregateSearchType";

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
        let query = [];
        for (let j=0, length2=data.length; j < length2; ++j) {
            let keys = Object.keys(data[j]);

            query.push({ [ keys[0] ]: generateQuery(keys[0], data[j][keys[0]]) });
        }
        
        return query;
    }

    if (data.value == null) {
        throw new WrongParamsError("'data' must contains the value", { n:0, data: data });
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
        throw new WrongParamsError("'data.value' must be an array", { n: 2, type: data.type });
    }
    
    if (data.type == SearchType.BIGGER_THAN) {
        return { $gte: parseInt(data.value) };
    } else if (data.type == SearchType.SMALLER_THAN) {
        return { $lte: parseInt(data.value) };
    } else if (data.type == SearchType.RANGE) {
        let query = {};
        if (data.value.$lte) query.$lte = parseInt(data.value.$lte);
        if (data.value.$gte) query.$gte = parseInt(data.value.$gte);

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
    }

    throw new WrongParamsError("Type is invalid", { n: 2, type: data.type });
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

    if (queryData.onlyPublish) searchObject[0]["$match"]["promotions.own.normal"] = true; // <= TODO: Delete it

    if (preAggregateData.$project) searchObject.push({ $project: preAggregateData.$project });
    
    // Fields to get
    if (queryData.projection) {
        if (!Array.isArray(queryData.projection)) {
            console.log(queryData);
            throw new WrongParamsError("'projection' must be an array", { n: 0 });
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
                throw new WrongParamsError("'range.x' must be a valid positive integer", { n: 1 });
            }
        } else {
            x = 0;
        }

        if (x != 0) searchObject.push({ $skip: x });

        const y = parseInt(queryData.range.y);
        if (Number.isNaN(y) || y < x) {
            throw new WrongParamsError("'range.y' must be a valid positive integer and bigger than 'range.x'(if present)", { n: 1 });
        }

        searchObject.push({ $limit: y - x });
    }

    if (queryData.onlyCount) {
        searchObject[2] = { $count: "number" };
    }

    return searchObject;
};