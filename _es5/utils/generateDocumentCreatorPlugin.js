"use strict";

require("core-js/modules/es.object.assign");

require("core-js/modules/es.object.to-string");

require("core-js/modules/es.promise");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

require("regenerator-runtime/runtime");

var _Checker = _interopRequireDefault(require("@genezis/genezis/Checker"));

var _deleteOnProduction = _interopRequireDefault(require("@genezis/genezis/utils/deleteOnProduction"));

var _doPlugins = require("@genezis/genezis/utils/doPlugins");

var _DocumentChecker = _interopRequireDefault(require("../DocumentChecker"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var GeneratorGenezisCheckerConfig = (0, _deleteOnProduction["default"])({
  documentConfig: _Checker["default"].required(),
  errorMessageGenerator: _Checker["default"]["function"]().required(),
  documentCreatorSettings: _Checker["default"].object(),
  generateCustomDocumentCreatorSettingsWhenIsEditing: _Checker["default"]["function"]()
});
var DocumentCreatorGenezisCheckerConfig = (0, _deleteOnProduction["default"])({
  doc: _Checker["default"].object().required(),
  input: _Checker["default"].object()
});

var _default = function _default(settings) {
  (0, _Checker["default"])(settings, GeneratorGenezisCheckerConfig);

  function documentCreator(data) {
    var documentCreatorSettings;
    return regeneratorRuntime.async(function documentCreator$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            (0, _Checker["default"])(data, DocumentCreatorGenezisCheckerConfig);
            documentCreatorSettings = settings.generateCustomDocumentCreatorSettingsWhenIsEditing ? settings.generateCustomDocumentCreatorSettingsWhenIsEditing(data.isEditing) : settings.documentCreatorSettings;
            _context.t0 = Object;
            _context.t1 = data.doc;
            _context.next = 6;
            return regeneratorRuntime.awrap((0, _DocumentChecker["default"])(data.input, settings.documentConfig, documentCreatorSettings));

          case 6:
            _context.t2 = _context.sent;

            _context.t0.assign.call(_context.t0, _context.t1, _context.t2);

          case 8:
          case "end":
            return _context.stop();
        }
      }
    });
  }

  documentCreator[_doPlugins.PLUGIN_ARGS_REQUIREMENTS_KEYWORD] = ["doc", "input"];

  if (settings.generateCustomDocumentCreatorSettingsWhenIsEditing) {
    documentCreator[_doPlugins.PLUGIN_ARGS_REQUIREMENTS_KEYWORD].push("isEditing");
  }

  return documentCreator;
};

exports["default"] = _default;