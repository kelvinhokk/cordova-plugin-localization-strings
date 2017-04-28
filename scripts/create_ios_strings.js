var fs = require('fs-extra');
var _ = require('lodash');
var iconv = require('iconv-lite');

var iosProjFolder;
var iosPbxProjPath;

var getValue = function(config, name) {
    var value = config.match(new RegExp('<' + name + '>(.*?)</' + name + '>', "i"));
    if(value && value[1]) {
        return value[1]
    } else {
        return null
    }
};

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
        var name = getValue(config, "name");

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
            var buffer = iconv.encode(stringToWrite, 'utf16');

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
            var results = _.filter(fileRefValues, {path: '"' + path + '"'});
            if (_.isArray(results) && results.length == 0) {
                //not found in pbxFileReference yet
                proj.addResourceFile("Resources/" + path, {variantGroup: true}, groupKey);
            }
        });
    }
}
module.exports = function(context) {

    var path = context.requireCordovaModule('path');
    var q = context.requireCordovaModule('q');
    var deferred = q.defer();
    var glob = context.requireCordovaModule('glob');
    var xcode = require('xcode');

    var localizableStringsPaths = [];
    var infoPlistPaths = [];

    getTargetLang(context)
        .then(function(languages) {

            languages.forEach(function(lang){

                //read the json file
                var langJson = require(lang.path);
                if (_.has(langJson, "config_ios")) {
                    //do processing for appname into plist
                    var plistString = langJson.config_ios;
                    if (!_.isEmpty(plistString)) {
                        writeStringFile(plistString, lang.lang, "InfoPlist.strings");
                        infoPlistPaths.push(lang.lang + ".lproj/" + "InfoPlist.strings");
                    }
                }

                //remove APP_NAME and write to Localizable.strings
                if (_.has(langJson, "app")) {
                    //do processing for appname into plist
                    var localizableStringsJson = langJson.app;
                    if (!_.isEmpty(localizableStringsJson)) {
                        writeStringFile(localizableStringsJson, lang.lang, "Localizable.strings");
                        localizableStringsPaths.push(lang.lang + ".lproj/" + "Localizable.strings");
                    }
                }
            });

            var proj = xcode.project(getXcodePbxProjPath());

            proj.parse(function (err) {
                if (err) {
                    deferred.reject(err);
                }
                else {

                    writeLocalisationFieldsToXcodeProj(localizableStringsPaths, 'Localizable.strings', proj);
                    writeLocalisationFieldsToXcodeProj(infoPlistPaths, 'InfoPlist.strings', proj);

                    fs.writeFileSync(getXcodePbxProjPath(), proj.writeSync());
                    console.log('new pbx project written with localization groups');
                    deferred.resolve();
                }
            });
        });

    return deferred.promise;
};

function getTargetLang(context) {
    var targetLangArr = [];
    var deferred = context.requireCordovaModule('q').defer();
    var path = context.requireCordovaModule('path');
    var glob = context.requireCordovaModule('glob');

    glob("translations/app/*.json",
        function(err, langFiles) {
            if(err) {
                deferred.reject(err);
            }
            else {

                langFiles.forEach(function(langFile) {
                    var matches = langFile.match(/translations\/app\/(.*).json/);
                    if (matches) {
                        targetLangArr.push({
                            lang: matches[1],
                            path: path.join(context.opts.projectRoot, langFile)
                        });
                    }
                });
                deferred.resolve(targetLangArr);
            }
        }
    );
    return deferred.promise;
}

