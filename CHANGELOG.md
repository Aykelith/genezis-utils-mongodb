# CHANGELOG

## Version 0.2.917

- resolved bug in `utils/generateDocumentCreatorPlugin.js` when no `createDocumentCreatorExtraParameters` was given

## Version 0.2.916

- modified the parameters to `utils/generateDocumentCreatorPlugin.js` for better clarity

## Version 0.2.915

- added the type `STRING` to `data/SearchAggregateValueType.js`
- throws error if `type` is not found in `createSearchAggregate.js:convertSearchType`

## Version 0.2.914

- changed `WrongParamsError` to `GenezisGeneralError` into `createSearchAggregate.js`
- added an default `onError` as parameter to all functions from `RequestsUtils.js`

## Version 0.2.913

- removed unused setting from `generateDocumentCreatorPlugin`

## Version 0.2.912

- replaced where needed `GenezisCheckerError` with `GenezisGeneralError`

## Version 0.2.9110

- moved ES5 into his own package

## Version 0.2.9100

- built ES5 files in folder `_es5`

## Version 0.2.9

- added the parameter `customFindOneSettings` to `RequestUtils.js:createSingleGetter` that is a function that is able to modify the settings given to the query.

## 21.10.2019

- added messages to some errors in `DocumentChecker.js`

## 16.10.2019

- added `notIn` parameter to the aggregate search types `IN_MONGOIDS`, `IN_NUMBERS` and `IN_STRINGS`.

## 14.10.2019

- fixed bug on `RequestUtils::createSingleDeleter` to `queryMaker` where the default generated query for when `oneField`
object was available was wrong.
