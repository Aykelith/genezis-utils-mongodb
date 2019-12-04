import GenezisChecker from "@genezis/genezis/Checker";
import deleteOnProduction from "@genezis/genezis/utils/deleteOnProduction";
import { PLUGIN_ARGS_REQUIREMENTS_KEYWORD } from "@genezis/genezis/utils/doPlugins";
import DocumentChecker from "../DocumentChecker";
const GeneratorGenezisCheckerConfig = deleteOnProduction({
  documentConfig: GenezisChecker.required(),
  errorMessageGenerator: GenezisChecker.function().required(),
  documentCreatorSettings: GenezisChecker.object(),
  generateCustomDocumentCreatorSettingsWhenIsEditing: GenezisChecker.function()
});
const DocumentCreatorGenezisCheckerConfig = deleteOnProduction({
  doc: GenezisChecker.object().required(),
  input: GenezisChecker.object()
});
export default (settings => {
  GenezisChecker(settings, GeneratorGenezisCheckerConfig);

  async function documentCreator(data) {
    GenezisChecker(data, DocumentCreatorGenezisCheckerConfig);
    let documentCreatorSettings = settings.generateCustomDocumentCreatorSettingsWhenIsEditing ? settings.generateCustomDocumentCreatorSettingsWhenIsEditing(data.isEditing) : settings.documentCreatorSettings;
    Object.assign(data.doc, (await DocumentChecker(data.input, settings.documentConfig, documentCreatorSettings)));
  }

  documentCreator[PLUGIN_ARGS_REQUIREMENTS_KEYWORD] = ["doc", "input"];

  if (settings.generateCustomDocumentCreatorSettingsWhenIsEditing) {
    documentCreator[PLUGIN_ARGS_REQUIREMENTS_KEYWORD].push("isEditing");
  }

  return documentCreator;
});