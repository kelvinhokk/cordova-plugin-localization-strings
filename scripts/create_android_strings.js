var fs = require('fs');
var path = require('path');
var glob = require('glob').globSync;
var mkdirp = require('mkdirp').mkdirp;
var _ = require('underscore');
var xml2js = require('xml2js');

function fileExists(path) {
    try {
        return fs.statSync(path).isFile();
    } catch (e) {
        return false;
    }
}

module.exports = function (context) {
    return getTargetLang(context).then(function (languages) {
        var promisesToRun = [];

        languages.forEach(function (lang) {
            // read the json file
            var langJson = require(lang.path);

            // check the locales to write to
            var localeLangs = [];
            if (_.has(langJson, 'locale') && _.has(langJson.locale, 'android')) {
                // iterate the locales
                _.forEach(langJson.locale.android, function (aLocale) {
                    localeLangs.push(aLocale);
                });
            } else {
                // use the default lang from the filename, for example "en" in en.json
                localeLangs.push(lang.lang);
            }

            _.forEach(localeLangs, function (localeLang) {
                var stringXmlFilePath = getLocalStringXmlPath(context, localeLang);
                var parser = new xml2js.Parser();

                var stringXmlJson;
                if (!fileExists(stringXmlFilePath)) {
                    stringXmlJson = {
                        resources: {
                            string: []
                        }
                    };
                    promisesToRun.push(processResult(context, localeLang, langJson, stringXmlJson));
                } else {
                    promisesToRun.push(
                        new Promise(function (resolve, reject) {
                            // lets read from strings.xml into json
                            fs.readFile(stringXmlFilePath, function (err, data) {
                                if (err) {
                                    return reject(err);
                                }

                                parser.parseString(data, function (err, result) {
                                    if (err) {
                                        return reject(err);
                                    }

                                    stringXmlJson = result;

                                    // initialize xmlJson to have strings
                                    if (!_.has(stringXmlJson, 'resources') || !_.has(stringXmlJson.resources, 'string')) {
                                        stringXmlJson.resources = {
                                            string: []
                                        };
                                    }

                                    processResult(context, localeLang, langJson, stringXmlJson).then(resolve, reject);
                                });
                            });
                        })
                    );
                }
            });
        });

        return Promise.all(promisesToRun);
    });
};

function getTranslationPath(config, name) {
    var matches = config.match(new RegExp('name="' + name + '" value="(.*?)"', 'i'));
    return (matches && matches[1]) || null;
}

function getDefaultPath(context) {
    var configNodes = context.opts.plugin.pluginInfo._et._root._children;
    for (var node in configNodes) {
        if (configNodes[node].attrib.name === 'TRANSLATION_PATH') {
            return configNodes[node].attrib.default;
        }
    }
    return '';
}

function getTargetLang(context) {
    var targetLangArr = [];

    var providedTranslationPathPattern;
    var providedTranslationPathRegex;
    var config = fs.readFileSync('config.xml').toString();
    var PATH = getTranslationPath(config, 'TRANSLATION_PATH');

    if (PATH == null) {
        PATH = getDefaultPath(context);
        providedTranslationPathPattern = PATH + '*.json';
        providedTranslationPathRegex = new RegExp(PATH + '(.*).json');
    }
    if (PATH != null) {
        if (/^\s*$/.test(PATH)) {
            providedTranslationPathPattern = getDefaultPath(context);
            providedTranslationPathPattern = PATH + '*.json';
            providedTranslationPathRegex = new RegExp(PATH + '(.*).json');
        } else {
            providedTranslationPathPattern = PATH + '*.json';
            providedTranslationPathRegex = new RegExp(PATH + '(.*).json');
        }
    }
    return new Promise(function (resolve, reject) {
        glob(providedTranslationPathPattern).forEach(function (langFile) {
          var matches = langFile.match(providedTranslationPathRegex);
          if (matches) {
            targetLangArr.push({
              lang: matches[1],
              path: path.join(context.opts.projectRoot, langFile),
            });
          }
        });
        resolve(targetLangArr);
    });
}

function getLocalStringXmlPath(context, lang) {
    var resPath = getResPath(context);
    var defaultLocale = getDefaultLocale();
    return path.normalize(path.join(resPath, 'values' + (lang !== defaultLocale ? '-' + lang : ''), 'strings.xml'));
}

function getResPath(context) {
    var locations = context.requireCordovaModule('cordova-lib/src/platforms/platforms').getPlatformApi('android').locations;
    return (locations && locations.res) || path.join(context.opts.projectRoot, 'platforms/android/res');
}

function getDefaultLocale() {
    var config = fs.readFileSync('config.xml').toString();
    var matches = config.match(new RegExp('<widget[^>]*?defaultlocale="(.*?)"[\\s\\S]*?>', 'i'));
    return (matches && matches[1]) || 'en';
}

// process the modified xml and write to file
function processResult(context, lang, langJson, stringXmlJson) {
    var mapObj = {};
    // create a map to the actual string
    _.forEach(stringXmlJson.resources.string, function (val) {
        if (_.has(val, '$') && _.has(val['$'], 'name')) {
            mapObj[val['$'].name] = val;
        }
    });

    var langJsonToProcess = _.extend({}, langJson.config_android, langJson.app, langJson.app_android);

    // now iterate through langJsonToProcess
    _.forEach(langJsonToProcess, function (val, key) {
        // positional string format is in Mac OS X format. change to android format
        val = val.replace(/\$@/gi, '$s');
        val = val.replace(/'/gi, "\\'");

        if (_.has(mapObj, key)) {
            // mapObj contains key. replace key
            mapObj[key]['_'] = val;
        } else {
            // add by inserting
            stringXmlJson.resources.string.push({
                _: val,
                $: { name: key }
            });
        }
    });

    // save to disk
    var filePath = getLocalStringXmlPath(context, lang);
    var langDir = path.dirname(filePath);

    return mkdirp(langDir).then(function () {
        fs.writeFileSync(filePath, buildXML(stringXmlJson));
        console.log('Localization saved:', filePath);
    });

    function buildXML(obj) {
        var builder = new xml2js.Builder();
        builder.options.renderOpts.indent = '\t';

        var x = builder.buildObject(obj);
        return x.toString();
    }
}
