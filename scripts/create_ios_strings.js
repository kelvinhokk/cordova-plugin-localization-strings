var fs = require('fs-extra');
var _ = require('lodash');
var iconv = require('iconv-lite');
var xmldom = require('xmldom');    
var path = require('path');


var iosProjFolder;
var iosPbxProjPath;

var getValue = function(configDoc, name) {
    var name = configDoc.getElementsByTagName(name)[0];
    return name.textContent
}

function jsonToDotStrings(jsonObj){
    var returnString = "";
    _.forEach(jsonObj, function(val, key){
        returnString += '"'+key+'" = "' + val +'";\n';
    });
    return returnString;
}

function initIosDir(){
    if (!iosProjFolder || !iosPbxProjPath) {
        var config = fs.readFileSync("config.xml").toString();
        var configDoc = (new xmldom.DOMParser()).parseFromString(config, 'application/xml');
        var name = getValue(configDoc, "name");

        iosProjFolder =  "platforms/ios/" + name;
        iosPbxProjPath = "platforms/ios/" + name + ".xcodeproj/project.pbxproj";
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

function writeStringFile(plistStringJsonObj, lang, fileName) {
    var lProjPath = getTargetIosDir() + "/Resources/" + lang + ".lproj";
    fs.ensureDir(lProjPath, function (err) {
        if (!err) {
            var stringToWrite = jsonToDotStrings(plistStringJsonObj);
            var buffer = iconv.encode(stringToWrite, 'utf8');

            fs.open(lProjPath + "/" + fileName, 'w', function(err, fd) {
                if(err) throw err;
                fs.writeFileSync(fd, buffer);
            });
        }
    });
}

function writeLocalisationFieldsToXcodeProj(filePaths, groupname, proj) {
    var fileRefSection = proj.pbxFileReferenceSection();
    var fileRefValues = _.values(fileRefSection);

    if (filePaths.length > 0) {

        // var groupKey;
        var groupKey = proj.findPBXVariantGroupKey({name: groupname});
        if (!groupKey) {
            // findPBXVariantGroupKey with name InfoPlist.strings not found.  creating new group
            var localizableStringVarGroup = proj.addLocalizationVariantGroup(groupname);
            groupKey = localizableStringVarGroup.fileRef;
        }

        filePaths.forEach(function (path) {
            var results = _.find(fileRefValues, function(o){
                return  (_.isObject(o) && _.has(o, "path") && o.path.replace(/['"]+/g, '') == path)
            });
            if (_.isUndefined(results)) {
                //not found in pbxFileReference yet
                proj.addResourceFile("Resources/" + path, {variantGroup: true}, groupKey);
            }
        });
    }
}
module.exports = function(context) {
    var xcode = require('xcode');

    var localizableStringsPaths = [];
    var infoPlistPaths = [];

    return getTargetLang(context)
        .then(function(languages) {

            languages.forEach(function(lang){

                //read the json file
                var langJson = require(lang.path);

                // check the locales to write to
                var localeLangs = [];
                if (_.has(langJson, "locale") && _.has(langJson.locale, "ios")) {
                    //iterate the locales to to be iterated.
                    _.forEach(langJson.locale.ios, function(aLocale){
                        localeLangs.push(aLocale);
                    });
                }
                else {
                    // use the default lang from the filename, for example "en" in en.json
                    localeLangs.push(lang.lang);
                }

                _.forEach(localeLangs, function(localeLang){
                    if (_.has(langJson, "config_ios")) {
                        //do processing for appname into plist
                        var plistString = langJson.config_ios;
                        if (!_.isEmpty(plistString)) {
                            writeStringFile(plistString, localeLang, "InfoPlist.strings");
                            infoPlistPaths.push(localeLang + ".lproj/" + "InfoPlist.strings");
                        }
                    }

                    //remove APP_NAME and write to Localizable.strings
                    if (_.has(langJson, "app")) {
                        //do processing for appname into plist
                        var localizableStringsJson = langJson.app;
                        
                        //ios specific strings
                        if (_.has(langJson, "app_ios")){
                            Object.assign(localizableStringsJson, langJson.app_ios);
                        }
                        
                        if (!_.isEmpty(localizableStringsJson)) {
                            writeStringFile(localizableStringsJson, localeLang, "Localizable.strings");
                            localizableStringsPaths.push(localeLang + ".lproj/" + "Localizable.strings");
                        }
                    }
                });

            });

            var proj = xcode.project(getXcodePbxProjPath());

            return new Promise(function (resolve, reject) {
              proj.parse(function (error) {
                  if (error) {
                    reject(error);
                  }

                  writeLocalisationFieldsToXcodeProj(localizableStringsPaths, 'Localizable.strings', proj);
                  writeLocalisationFieldsToXcodeProj(infoPlistPaths, 'InfoPlist.strings', proj);

                  fs.writeFileSync(getXcodePbxProjPath(), proj.writeSync());
                  console.log('new pbx project written with localization groups');
                  
                  var platformPath   = path.join( context.opts.projectRoot, "platforms", "ios" );
                  var projectFileApi = require( path.join( platformPath, "/cordova/lib/projectFile.js" ) );
                  projectFileApi.purgeProjectFileCache( platformPath );
                  console.log(platformPath + ' purged from project cache');
                  
                  resolve();
              });
            });
        });
};


function getTranslationPath (config, name) {
    var value = config.match(new RegExp('name="' + name + '" value="(.*?)"', "i"))

    if(value && value[1]) {
        return value[1];

    } else {
        return null;
    }
}

function getDefaultPath(context){
    var configNodes = context.opts.plugin.pluginInfo._et._root._children;
    var defaultTranslationPath = '';

    for (var node in configNodes) {
        if (configNodes[node].attrib.name == 'TRANSLATION_PATH') {
            defaultTranslationPath = configNodes[node].attrib.default;
        }
    }
    return defaultTranslationPath;
}


function getTargetLang(context) {
    var targetLangArr = [];

    var path = require('path');
    var glob = require('glob');
    var providedTranslationPathPattern;
    var providedTranslationPathRegex;
    var config = fs.readFileSync("config.xml").toString();  
    var PATH = getTranslationPath(config, "TRANSLATION_PATH");

    if(PATH == null){
        PATH = getDefaultPath(context);
        providedTranslationPathPattern = PATH + "*.json";
        providedTranslationPathRegex = new RegExp((PATH + "(.*).json"));
    }
    if(PATH != null){
        if(/^\s*$/.test(PATH)){
            providedTranslationPathPattern = getDefaultPath(context);
            providedTranslationPathPattern = PATH + "*.json";
            providedTranslationPathRegex = new RegExp((PATH + "(.*).json"));
        }
        else {
            providedTranslationPathPattern = PATH + "*.json";
            providedTranslationPathRegex = new RegExp((PATH + "(.*).json"));
        }
    }

    return new Promise(function (resolve, reject) {
      glob(providedTranslationPathPattern, function(error, langFiles) {
        if (error) {
          reject(error);
        }
        langFiles.forEach(function(langFile) {
          var matches = langFile.match(providedTranslationPathRegex);
          if (matches) {
            targetLangArr.push({
              lang: matches[1],
              path: path.join(context.opts.projectRoot, langFile)
            });
          }
        });
        resolve(targetLangArr);
      });
    });
}

