# genezis-utils-mongodb

## RequestsUtils

A collection of functions that creates different types of requests that perform actions on a collection.

Every single function will accept the following arguments:

| Setting parameter name | Expected type | Required | Description |
|---|---|---|---|
| collection | MongoDBCollection/Function->MongoDBCollection(req, data, sharedData) | **Yes** | The collection where the actions to be performed. It can also be a function that will return the collection. The function will receive the request object, the request data and the shared data |
| onBegin | Function[]->null(req, data, sharedData) | No | Argument from the package `@genezis/genezis-utils-router`. An array of functions that will be called on the begging of the request. The functions will receive the request object, the request data and the shared data |
| onError | Function->null(error, req, data, sharedData) | **Yes** | A function that will process the predefined errors from the request

### createSingleGetter

Create a request that is able to fetch a single document from a collection.

Short summary of the arguments:

| Setting parameter name | Expected type | Required | Description |
|---|---|---|---|
| getBy | RequestField | No | The possible fields to get by the document. The order of them matters |
| findQueryMiddleware | Function->object(req, data, sharedData, actualFindQuery) | No | A function that will be called after the query formed from `getBy` is created. The function must return the modified query. The function get as parameters the request object, the request data, the shared data and the actual query |
| customFindQueryMaker | Function->object(req, data, sharedData) | No | A function that created the find one query. It must return the query. It will receive the request object, the request data and the shared data |
| userProjectionAllowed | Boolean | No | Allow the user to request specific fields. Default value is `false` |
| userProjectionInputField | String | No | The name of the input field where the user will specify the fields for projection. It is required if `userProjectionAllowed` is `true`
| customOnSuccess | Function->null(req, data, sharedData, onSuccess, foundDoc) | No | A function that will replace the actual call to `onSuccess(foundDoc)`. It will receive the request object, the request data, the shared data, the `onSuccess` function and the found doc
| onNoDocumentFound | Function->boolean(req, data, sharedData, onSuccess) | No | Called when no document found. It should return `true` if inside the function the method `onSuccess` is called. It will receive the request object, the request data, the shared data and the `onSuccess` function.
| customFindOneSettings | Function->object(req, data, sharedData, actualFindOneSettings) | No | A function that is called after user projection is calculated (if allowed) and receives the request object, the request data, the shared data and the actual `findOneSettings`. `findOneSettings` is the object that will be given to MongoDB's Collection `findOne` as settings.

**Attention!** The fields `getBy` and `customFindQueryMaker` can't go together, but at least one is expected to be given!  
**Attention!** `findQueryMiddleware` works only with `getBy`, but not with `customFindQueryMaker`

Possible errors:

- **GenezisCheckerTypes.NOT_ARRAY**
- **QUERY_FROM_GIVEN_FIELDS_NOT_FOUND_MATCH**
