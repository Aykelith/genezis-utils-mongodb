module.exports = {
	ignore: [ /node_modules/ ],
	"presets": [["@babel/env", { "useBuiltIns": "usage", "corejs": 3 }]],
	"plugins": [
		["@babel/plugin-syntax-object-rest-spread"],
		["@babel/plugin-syntax-dynamic-import"],
		["@babel/plugin-syntax-async-generators"],
		["@babel/plugin-transform-regenerator"],
		["@babel/plugin-proposal-decorators", { "legacy": true }],
		["@babel/plugin-proposal-class-properties", { "loose": true }]
	]
};
