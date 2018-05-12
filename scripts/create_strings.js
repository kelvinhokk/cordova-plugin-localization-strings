var ios_script = require('./create_ios_strings');
var android_script = require('./create_android_strings');

module.exports = function(context) {
    var Q = require('q');
    var platforms = context.opts.platforms;

    var promises = [];

    if (platforms.indexOf('ios') >= 0) {
        promises.push(ios_script(context));
    }

    if (platforms.indexOf('android') >= 0) {
        promises.push(android_script(context));
    }

    // https://stackoverflow.com/a/43994999/2175025
    process.on('unhandledRejection', function(reason, p) {
        console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
        // application specific logging, throwing an error, or other logic here
    });
    console.log('Listening to promises rejection');

    console.log('Promises');
    console.log(promises);

    return Q.all(promises);
};
