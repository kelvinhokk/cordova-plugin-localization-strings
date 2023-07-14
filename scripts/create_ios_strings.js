var fs = require("fs");
var path = require("path");
var mkdirp = require("mkdirp").mkdirp;
var _ = require("underscore");
var xcode = require("xcode");
var utils = require("./utils");

var iosProjFolder;
var iosPbxProjPath;

function jsonToDotStrings(jsonObj) {
	var returnString = "";
	_.forEach(jsonObj, function (val, key) {
		returnString += '"' + key + '" = "' + val + '";\n';
	});
	return returnString;
}

function getProjectName() {
	var config = fs.readFileSync("config.xml").toString();
	var matches = config.match(new RegExp("<name>(.*?)</name>", "i"));

	// if simple name-tag not found then try optional form of name tag with short name
	if (!matches)
		matches = config.match(new RegExp('<name short=".*?">(.*?)</name>', "i"));

	return (matches && matches[1]) || null;
}

function initIosDir() {
	if (!iosProjFolder || !iosPbxProjPath) {
		var projectName = getProjectName();
		iosProjFolder = "platforms/ios/" + projectName;
		iosPbxProjPath =
			"platforms/ios/" + projectName + ".xcodeproj/project.pbxproj";
	}
}

function getTargetIosDir() {
	initIosDir();
	return iosProjFolder;
}

function getXcodePbxProjPath() {
	initIosDir();
	return iosPbxProjPath;
}

function writeStringFile(plistStringJsonObj, lang, fileName, bundle) {
	var lProjPath =
		getTargetIosDir() +
		"/Resources/" +
		(bundle ? bundle + "/" : "") +
		lang +
		".lproj";
	mkdirp(lProjPath).then(function () {
		var stringToWrite = jsonToDotStrings(plistStringJsonObj);
		fs.writeFileSync(path.join(lProjPath, fileName), stringToWrite);
	});
}

function writeLocalisationFieldsToXcodeProj(filePaths, groupName, proj) {
	var fileRefSection = proj.pbxFileReferenceSection();
	var fileRefValues = _.values(fileRefSection);

	if (filePaths.length > 0) {
		var groupKey = proj.findPBXVariantGroupKey({ name: groupName });
		if (!groupKey) {
			// findPBXVariantGroupKey with name InfoPlist.strings not found. creating new group
			var localizableStringVarGroup =
				proj.addLocalizationVariantGroup(groupName);
			groupKey = localizableStringVarGroup.fileRef;
		}

		filePaths.forEach(function (path) {
			var results = _.find(fileRefValues, function (o) {
				return (
					_.isObject(o) &&
					_.has(o, "path") &&
					o.path.replace(/['"]+/g, "") === path
				);
			});
			if (_.isUndefined(results)) {
				// not found in pbxFileReference yet
				proj.addResourceFile(
					"Resources/" + path,
					{ variantGroup: true },
					groupKey
				);
			}
		});
	}
}

module.exports = function (context) {
	var infoPlistPaths = [];
	var localizableStringsPaths = [];
	var settingsBundlePaths = [];
	var appShortcutsPaths = [];

	return utils.getTargetLang(context).then(function (languages) {
		languages.forEach(function (lang) {
			// read the json file
			var langJson = require(lang.path);

			// check the locales to write to
			var localeLangs = [];
			if (_.has(langJson, "locale") && _.has(langJson.locale, "ios")) {
				// iterate the locales
				_.forEach(langJson.locale.ios, function (aLocale) {
					localeLangs.push(aLocale);
				});
			} else {
				// use the default lang from the filename, for example "en" in en.json
				localeLangs.push(lang.lang);
			}

			_.forEach(localeLangs, function (localeLang) {
				if (_.has(langJson, "config_ios")) {
					// do processing for appname into plist
					var plistString = langJson.config_ios;
					if (!_.isEmpty(plistString)) {
						writeStringFile(plistString, localeLang, "InfoPlist.strings");
						infoPlistPaths.push(localeLang + ".lproj/" + "InfoPlist.strings");
					}
				}

				// remove APP_NAME and write to Localizable.strings
				if (_.has(langJson, "app")) {
					// do processing for appname into plist
					var localizableStringsJson = langJson.app;

					// ios specific strings
					if (_.has(langJson, "app_ios")) {
						Object.assign(localizableStringsJson, langJson.app_ios);
					}

					if (!_.isEmpty(localizableStringsJson)) {
						writeStringFile(
							localizableStringsJson,
							localeLang,
							"Localizable.strings"
						);
						localizableStringsPaths.push(
							localeLang + ".lproj/" + "Localizable.strings"
						);
					}
				}

				if (
					_.has(langJson, "app_shortcuts") &&
					!_.isEmpty(langJson.app_shortcuts)
				) {
					writeStringFile(
						langJson.app_shortcuts,
						localeLang,
						"AppShortcuts.strings"
					);
					appShortcutsPaths.push(
						localeLang + ".lproj/" + "AppShortcuts.strings"
					);
				}

				// to create Settings.bundle localizations
				if (_.has(langJson, "settings_ios")) {
					var localizableSettingsJson = langJson.settings_ios;
					if (!_.isEmpty(localizableSettingsJson)) {
						_.each(localizableSettingsJson, function (value, key) {
							var settingsFileName = key + ".strings";
							var localizableSettingsStringsRoot = value;

							if (!_.isEmpty(localizableSettingsStringsRoot)) {
								writeStringFile(
									localizableSettingsStringsRoot,
									localeLang,
									settingsFileName,
									"Settings.bundle"
								);
								settingsBundlePaths.push(
									"Settings.bundle" + localeLang + ".lproj/" + settingsFileName
								);
							}
						});
					}
				}
			});
		});

		var pbxProjPath = getXcodePbxProjPath();
		var proj = xcode.project(pbxProjPath);

		return new Promise(function (resolve, reject) {
			proj.parse(function (error) {
				if (error) {
					reject(error);
				}

				writeLocalisationFieldsToXcodeProj(
					infoPlistPaths,
					"InfoPlist.strings",
					proj
				);
				writeLocalisationFieldsToXcodeProj(
					localizableStringsPaths,
					"Localizable.strings",
					proj
				);
				writeLocalisationFieldsToXcodeProj(
					appShortcutsPaths,
					"AppShortcuts.strings",
					proj
				);

				fs.writeFileSync(pbxProjPath, proj.writeSync());
				console.log(
					"Pbx project written with localization groups",
					_.map(languages, "lang")
				);

				var platformPath = path.join(
					context.opts.projectRoot,
					"platforms",
					"ios"
				);
				var projectFilePath = path.join(
					platformPath,
					"/cordova/lib/projectFile.js"
				);
				var projectFileExists = fs.existsSync(projectFilePath);

				// Starting cordova-ios@7.0.0, projectFile.js is not part of the platform folder anymore and has to be grabbed from node_modules
				var projectFileApi = projectFileExists ? require(projectFilePath) : require("cordova-ios/lib/projectFile");
				projectFileApi.purgeProjectFileCache(platformPath);

				resolve();
			});
		});
	});
};
