# Cordova Localization String Plugin

This plugin helps you to manage string files that you need natively, namely on Localizable.strings and InfoPlist.strings on iOS, and strings.xml on Android.

This plugin also lets you localize your app name on both iOS and Android.

## Using

    
Install the plugin by fetching the dependencies

    $ cordova plugin add https://github.com/kelvinhokk/cordova-plugin-localization-strings.git --fetch
    

Modify your project root to have the following structure:

```
Cordova Project Root
  |
  |__ translations
           |
           |__ app
                |
                |__  en.json
                |__  zh.json
                |__  ja.json
                
```

A JSON file may look like this  (Note: Breaking change from 0.1.4 onwards - new JSON format).
```
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


Install iOS or Android platform

    cordova platform add ios
    cordova platform add android
    
Run the code

    cordova prepare ios 

## Dependencies

This plugin relies on node-xcode >= 0.9.0.

Do remember to install the other dependencies via the --fetch when installing the plugin.

## Details (iOS)

The plugin reads the assumed directory structure.  The plugin reads from all the fields in config_ios and writes into the InfoPlist.strings, which will be placed in the respective locale.lproj directory.   The rest of the strings in "app" will be placed in the Localizable.strings file and placed in the locale directory. 

## Details (Android)

The plugin reads the assumed directory structure, the plugin will combine all properties in "config_android" and "app", and inserted into the strings.xml of the locale's  /res/val-locale/strings.xml 
