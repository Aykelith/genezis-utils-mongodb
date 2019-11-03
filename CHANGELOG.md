# CHANGELOG

## 21.10.2019

- added messages to some errors in `DocumentChecker.js`

## 16.10.2019

- added `notIn` parameter to the aggregate search types `IN_MONGOIDS`, `IN_NUMBERS` and `IN_STRINGS`.

## 14.10.2019

- fixed bug on `RequestUtils::createSingleDeleter` to `queryMaker` where the default generated query for when `oneField`
object was available was wrong.
