# CHANGELOG

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
