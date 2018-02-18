var ios_script = require('./create_ios_strings');
var android_script = require('./create_android_strings');

module.exports = function(context) {
  var Q = context.requireCordovaModule('q')
  var platformMetadata = context.requireCordovaModule('cordova-lib/src/cordova/platform_metadata');

  return platformMetadata.getPlatformVersions(context.opts.projectRoot)
    .then(function(platformVersions) {
      var promises = [];
      var platforms = platformVersions.map(function(platformVersion) {
        return platformVersion.platform;
      });
      if (platforms.indexOf('ios') >= 0) {
        promises.push(ios_script(context));
      }
      if (platforms.indexOf('android') >= 0) {
        promises.push(android_script(context));
      }
      return Q.all(promises);
    });
}
