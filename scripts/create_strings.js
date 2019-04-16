var ios_script = require('./create_ios_strings');
var android_script = require('./create_android_strings');

module.exports = function(context) {
    var Q = require('q');
    var platforms = context.requireCordovaModule('cordova-lib/src/cordova/util').listPlatforms(context.opts.projectRoot);

    var promises = [];

    if (platforms.indexOf('ios') >= 0) {
        promises.push(ios_script(context));
    }

    if (platforms.indexOf('android') >= 0) {
        promises.push(android_script(context));
    }

    return Q.all(promises);
};
