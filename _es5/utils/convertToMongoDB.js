"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _mongodb = require("mongodb");

var _default = function _default(x) {
  if (!_mongodb.ObjectID.isValid(x)) throw new Error();
  return (0, _mongodb.ObjectID)(x);
};

exports["default"] = _default;