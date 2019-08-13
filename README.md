# Cordova Localization String Plugin

This plugin helps you to manage string files that you need natively, namely on Localizable.strings and InfoPlist.strings on iOS, and strings.xml on Android.

This plugin also lets you localize your app name on both iOS and Android.


## How to Use

    
Install the plugin by fetching the dependencies

    $ cordova plugin add cordova-plugin-localization-strings --save
    

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

A JSON file may look like this  (Note: Breaking change from 1.0.0 onwards - new JSON format).
```json
{
	"config_ios" : {
		"NSCameraUsageDescription": "Take pictures",
		"CFBundleDisplayName": "Some App Name",
		"CFBundleName": "Some App Name"
	},
	"config_android" : {
		"app_name": "Some App Name"
	},
	"app" : {
		"HAVE_MAIL_TITLE": "You have mail.",
		"HAVE_MAIL_MSG": "%1$@ has you a message titled \\\"%2$@\\\""
	}
}


```
By default, the language for the Localizable.strings, InfoPlist.strings or strings.xml is taken from the filename.  

For example, if the filename is es.json,  the language is hence "es", and the plugin will create "/Resources/es.lproj/Localizable.strings" or "/values-es/strings.xml".

Install iOS or Android platform

    cordova platform add ios
    cordova platform add android
    
Run the code

    cordova prepare ios 

#### Platform Specific Localizations

There are some platform specific localizations which differ for Android and iOS, for example for Android:
- zh-rCN
- zh-rHK
- zh-rTW
                                                   
and for iOS:
- zh-Hans
- zh-Hans-CN
- zh-Hant
- zh-Hant-TW

In this case, you can use the locale in the json file to specify the platform localizations as in the following examples.  

N.B.  The "locale" key is optional (if platform localization is not required).

zh-Hans.json
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

zh-Hant.json
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

This plugin relies on node-xcode >= 0.9.0, node >= 5.0.0, cordova >= 6.0.0.

Do remember to install the other dependencies via the --fetch when installing the plugin.

## Use Cases

Typically in a Cordova application, localization is performed on the javascript layer.  There are several libraries to do help do so like angular-translate on ionic 1 and ngx-translate on ionic 2, with the help of plugins like cordova-plugin-globalization to retrieved the locale or preferred language natively.

This plugin helps in native localization in the following use cases:

### Localizing App Name

The plugin will help to localize your app name if you require it to be named differently in different languages.  Use the following json file format.

```json
{
	"config_ios" : {
		"CFBundleDisplayName": "Some App Name",
		"CFBundleName": "Some App Name"
	},
	"config_android" : {
		"app_name": "Some App Name"
	}
}

```
### Localizing iOS Permissions

This plugin will help in localize the iOS permission descriptions, for example NSCameraUsageDescription.  A full list of iOS permissions and other infoPlist strings that can be found here. (https://developer.apple.com/library/content/documentation/General/Reference/InfoPlistKeyReference/Articles/CocoaKeys.html "CocoaKeys")

Example usage:

```json
{
	"config_ios" : {
		"NSCameraUsageDescription": "Take pictures",
		"NSLocationUsageDescription": "Need Location for Some Purpose",
	}
}

```

### Push notifications messages 

Typically, there are 2 main ways push notifications can be localised:
* your app saves your user's selected language on the server, and pushes a localised string in the push notification to your user.
* your server pushes a key to the phone, and the app displays a localised version based on the key in the localization bundle, as determined from the user's phone OS's languauge.

This plugin helps in the latter approach.

More information about the respective string localizations and formatting here:

* Storing Localized Content in Your App Bundle (https://developer.apple.com/library/content/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/CreatingtheNotificationPayload.html#//apple_ref/doc/uid/TP40008194-CH10-SW9)
* Formatting strings (https://developer.android.com/guide/topics/resources/string-resource.html#FormattingAndStyling)


Example usage:

```json
{
	"app" : {
		"HAVE_MAIL_TITLE": "You have mail.",
		"HAVE_INVITE_MSG": "%1$@ has invited you to game room %2$@"
	}
}

```

The plugin will automatically generate Localizable.strings file using the following entry on iOS:
```
"HAVE_MAIL_TITLE" = "You have mail.";
"HAVE_INVITE_MSG" = "%1$@ has invited you to game room %2$@";
```

And on Android, the respective locale's strings.xml:
```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<resources>
    <string name="HAVE_MAIL_TITLE">You have mail.</string>
    <string name="HAVE_INVITE_MSG">%1$s has invited you to game room %2$s</string>
</resources>
```

## Details (iOS)

The plugin reads the assumed directory structure.  The plugin reads from all the fields in config_ios and writes into the InfoPlist.strings, which will be placed in the respective locale.lproj directory.   The rest of the strings in "app" will be placed in the Localizable.strings file and placed in the locale directory. 

## Details (Android)

The plugin reads the assumed directory structure, the plugin will combine all properties in "config_android" and "app", and inserted into the strings.xml of the locale's  /res/val-locale/strings.xml 


## Override platform specific translations:
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
(if `app_ios` or `app_android` are detected they will be used and override keys from `app`)
