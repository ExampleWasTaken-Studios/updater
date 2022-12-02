# updater
Updater is used by EWT Studios to update our electron desktop apps.

## Important
The latest version (v2.0.5) includes important security fixes! Please use `npm i @ewt-studios/updater@latest` to install it.

## Install
```sh
npm i @ewt-studios/updater
```

## Behavior
### macOS
This package provides auto updates for unsigned macOS applications. Once an update has been found, it is downloaded and the user is notified through a native notification along with the option to quit and install.

### Windows
On Windows we use the default [electron-updater](https://www.npmjs.com/package/electron-updater) package and call `autoUpdater.checkForUpdatesAndNotify()`. The option to quit and install through the notification might be added later.

## Usage
The package is 100% inline-documented.
```ts
import { app } from "electron";
import { Updater } from "@ewt-studios/updater";

app.on("ready", async () => {
  const updater = new Updater(app, "<repo_owner_name>", "<repo_name>");

  updater.checkForUpdatesAndDownload()
});
```
### Events
> These events are only fired on macOS. Use electron-updater events on Windows.

Updater provides events to inform about different states during update handling.
  
We provide the following events:
- `checking-for-update`
  - Fired as soon as the updater start to look for an update.
- `update-available`
  - Fired, as the name suggests, when an update has been found.
- `update-not-available`
  - Fired when no update could be found.
- `download-in-progress`
  - Fired just before the download begins.
- `download-complete`
  - Fired when the download is completely finished.
- `error`
  - Fired whenever an error occurred. The error will be passed to the handler method.

## Run
```sh
npm start # => tsc -w
```

## Test
```sh
npm test # => tsc && electron .
```
For testing purposes electron is included in this project. To use it you need to change the `main` property in `package.json` to `electron/main.js`. To adhere to npm package guidelines this should always be changed back to `lib/index.js` before pushing.

Electron is not included in the published npm package.

## Build
```sh
npm run build # => tsc
```
