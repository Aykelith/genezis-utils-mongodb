import { ObjectID as MongoID } from "mongodb";

export default (x) => {
    if (!MongoID.isValid(x)) throw new Error();
    return MongoID(x);
}