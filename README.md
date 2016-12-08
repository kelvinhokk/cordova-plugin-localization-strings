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

A JSON file may look like this
```
{
  "APP_NAME": "Some App Name",
  "HAVE_MAIL_TITLE": "You have mail.",
  "HAVE_MAIL_MSG": "%1$@ has you a message titled \\\"%2$@\\\""
}

```


Install iOS or Android platform

    cordova platform add ios
    cordova platform add android
    
Run the code

    cordova prepare ios 

## Dependencies

This plugin depends on a fork on the node-xcode project, that is currently not in the master yet.

## Details (iOS)

The plugin reads the assumed directory structure.  If the json file contains the "APP_NAME" property,  the CFBundleDisplayName and CFBundleName properties in the InfoPlist.strings will be created and placed in the respective locale.lproj directory.   The rest of the strings will be placed in the Localizable.strings file and placed in the locale directory. 

## Details (Android)

The plugin reads the assumed directory structure, and the app_name property will be updated, and the rest of the properties inserted in to the strings.xml of the locale's  /res/val-locale/strings.xml 
