# Cordova Localization Strings Plugin

This plugin helps you manage string files that you need natively, namely `Localizable.strings` and `InfoPlist.strings` on iOS, and `strings.xml` on Android.

This plugin also lets you localize your app name on both iOS and Android.

## How to Use

Install the plugin

    $ cordova plugin add cordova-plugin-localization-strings

Modify your project root to have the following structure:

```
Cordova Project Root
  |
  |__ translations
           |
           |__ app
                |
                |__  en.json
                |__  es.json
                |__  ja.json
```

A JSON file may look like this (Note: Breaking change from 1.0.0 onwards - new JSON format).

```json
{
    "config_ios": {
        "NSCameraUsageDescription": "Take pictures",
        "CFBundleDisplayName": "Some App Name",
        "CFBundleName": "Some App Name"
    },
    "config_android": {
        "app_name": "Some App Name"
    },
    "app": {
        "HAVE_MAIL_TITLE": "You have mail.",
        "HAVE_MAIL_MSG": "%1$@ has you a message titled \\\"%2$@\\\""
    }
}
```

By default, the language for the `Localizable.strings`, `InfoPlist.strings` or `strings.xml` is taken from the filename.

For example, if the filename is `es.json`, the language is hence `"es"`, and the plugin will create `"/Resources/es.lproj/Localizable.strings"` or `"/res/values-es/strings.xml"`.

Install iOS or Android platform

    cordova platform add ios
    cordova platform add android

Run the code

    cordova prepare ios
    cordova prepare android

#### Platform Specific Localizations

There are some platform specific localizations which differ for Android and iOS, for example for Android:

-   `zh-rCN`
-   `zh-rHK`
-   `zh-rTW`

and for iOS:

-   `zh-Hans`
-   `zh-Hans-CN`
-   `zh-Hant`
-   `zh-Hant-TW`

In this case, you can add the `"locale"` in the JSON file to specify the platform localizations as in the following examples.

N.B. The `"locale"` key is optional (if platform localization is not required).

-   `zh-Hans.json`

```json
{
    "locale": {
        "ios": ["zh-Hans"],
        "android": ["zh-rCN"]
    },
    "config_ios": {
        "NSCameraUsageDescription": "扫描二维码",
        "CFBundleDisplayName": "应用程序名称",
        "CFBundleName": "应用程序名称"
    },
    "config_android": {
        "app_name": "应用程序名称"
    },
    "app": {
        "HAVE_MAIL_TITLE": "你收到了邮件",
        "HAVE_MAIL_MSG": "％1$@给您发送了封邮件，标题为\\\"％2$@\\\""
    }
}
```

-   `zh-Hant.json`

```json
{
    "locale": {
        "ios": ["zh-Hant"],
        "android": ["zh-rTW", "zh-rHK"]
    },
    "config_ios": {
        "NSCameraUsageDescription": "掃描二維碼",
        "CFBundleDisplayName": "應用程序名稱",
        "CFBundleName": "應用程序名稱"
    },
    "config_android": {
        "app_name": "應用程序名稱"
    },
    "app": {
        "HAVE_MAIL_TITLE": "你收到了郵件",
        "HAVE_MAIL_MSG": "％1$@給您發送了封郵件，標題為\\\"％2$@\\\""
    }
}
```

## Dependencies

This plugin works on cordova >= 6.1.0 and node >= 10.

## Use Cases

Typically, in a Cordova application, localization is performed on the javascript layer. There are several libraries to help do so like [angular-translate](https://angular-translate.github.io/) on [Ionic 1](https://ionicframework.com/) and [ngx-translate](http://www.ngx-translate.com/) on [Ionic 2+](https://ionicframework.com/), with the help of plugins like [cordova-plugin-globalization](https://github.com/apache/cordova-plugin-globalization) to retrieve the locale or preferred language natively.

This plugin helps for native localization in the following use cases:

### Localizing App Name

The plugin will help localize the app name if you require it to be named differently in different languages. Use the following JSON file format.

```json
{
    "config_ios": {
        "CFBundleDisplayName": "Some App Name",
        "CFBundleName": "Some App Name"
    },
    "config_android": {
        "app_name": "Some App Name"
    }
}
```

### Localizing iOS Permissions

This plugin will help localize the iOS permission descriptions, for example `NSCameraUsageDescription`. A full list of iOS permissions and other `InfoPlist` strings that can be found [here](https://developer.apple.com/library/content/documentation/General/Reference/InfoPlistKeyReference/Articles/CocoaKeys.html).

Example usage:

```json
{
    "config_ios": {
        "NSCameraUsageDescription": "Take pictures",
        "NSLocationUsageDescription": "Need Location for Some Purpose"
    }
}
```

### iOS Settings localizations

This plugin can localize iOS Settings bundles.

Example usage:
```json
{
    "settings_ios": {
        "Root": {
            "App version": "App version"
        }
    }
}
```

In the example shown, it would create a file such as "platforms/ios/<app name>/Resources/Settings.bundle/<language>.lproj/Root.strings" with
the expected localizations for that language.

### iOS Settings localizations

This plugin can localize iOS AppShortcuts used by Shortcuts app and Siri.

Example usage:

```json
{
  "app_shortcuts": {
    "example_shortcut": "Execute example shortcut of ${applicationName}"
  }
}
```

The Key-Value-Pairs are saved as AppShortcuts.strings in the Resources folder.
Their value is not modified. Therefor all restrictions for app shortcut phrases apply.

### Push notifications messages

Typically, there are 2 main ways push notifications can be localized:

-   your app saves your user's selected language on the server, and pushes a localized string in the push notification to your user.
-   your server pushes a key to the phone, and the app displays a localized version based on the key in the localization bundle, as determined from the user's phone OS's language.

This plugin helps in the latter approach.

More information about the respective string localizations and formatting here:

-   [Storing Localized Content in Your App Bundle](https://developer.apple.com/library/content/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/CreatingtheNotificationPayload.html#//apple_ref/doc/uid/TP40008194-CH10-SW9)
-   [Formatting strings](https://developer.android.com/guide/topics/resources/string-resource.html#FormattingAndStyling)

Example usage:

```json
{
    "app": {
        "HAVE_MAIL_TITLE": "You have mail.",
        "HAVE_INVITE_MSG": "%1$@ has invited you to game room %2$@"
    }
}
```

The plugin will automatically generate `Localizable.strings` file using the following entry on iOS:

```
"HAVE_MAIL_TITLE" = "You have mail.";
"HAVE_INVITE_MSG" = "%1$@ has invited you to game room %2$@";
```

And on Android, the respective locale's `strings.xml`:

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<resources>
    <string name="HAVE_MAIL_TITLE">You have mail.</string>
    <string name="HAVE_INVITE_MSG">%1$s has invited you to game room %2$s</string>
</resources>
```

## Details for iOS

The plugin reads the assumed directory structure. It then reads from all the fields in `"config_ios"` and writes into the `InfoPlist.strings`, which will be placed in the respective `locale.lproj` directory. The rest of the strings in `"app"` will be placed in the `Localizable.strings` file inside the locale directory.

## Details for Android

The plugin reads the assumed directory structure. It then combines all properties in `"config_android"` and `"app"` to insert them into the `strings.xml` of the locale's `/res/values-<xx>/strings.xml`.

Note that for the app's default language the strings are stored in `"/res/values/strings.xml"` (directory name without `-<xx>` suffix).
This plugin considers `'en'` for the default value, matching your `en.json` file if it exists, but to change this you should define your own value through the `defaultlocale` attribute on your [`<widget>`](https://cordova.apache.org/docs/en/latest/config_ref/#widget) in _config.xml_.
For example `<widget id="" defaultlocale="es">…</widget>`.

## Overriding platform specific translations:

```json
{
    "app": {
        "HAVE_MAIL_TITLE": "Sie haben Post. This should be overwritten by platform-specific string.",
        "HAVE_MAIL_MSG": "%1$@ has you a message titled \\\"%2$@\\\""
    },
    "app_ios": {
        "HAVE_MAIL_TITLE": "Sie haben Post in iOS.",
        "Key with Spaces": "Schlüssel mit Leerzeichen"
    },
    "app_android": {
        "HAVE_MAIL_TITLE": "Sie haben Post in Android.",
        "ONLY_ON_ANDROID": "Testmeldung nur unter Android."
    }
}
```

If `"app_ios"` or `"app_android"` are detected, they will be used and override keys from `"app"`.

### Publishing commands:

```bash
cd cordova-plugin-localization-strings
git pull
git tag 5.0.6
git push --tags --force
npm version 5.0.6
npm publish 
```
