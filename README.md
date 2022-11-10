# updater
Updater is used by EWT Studios to update our electron desktop apps.

## Install
```sh
npm i @ewt-studios/updater
```

## Behavior
### macOS
This package provides auto updates for unsigned macOS applications. For now it only downloads the update into the users `Downloads` folder. Listen for the `download-complete` event to know when the download is complete.

### Windows
On Windows this package uses the default [electron-updater](https://www.npmjs.com/package/electron-updater) package and calls `autoUpdater.checkForUpdatesAndNotify()`.

## Usage
The package is completely fully inline-documented.
```ts
import { app, shell } from "electron";
import { Updater } from "@ewt-studios/updater";

app.on("ready", () => {
  const updater = new Updater(app, "<repo_owner_name>", "<repo_name>");

  updater.on("download-complete", () => {
    // the code to be executed whenever the 'download-complete' event fires
  });

  updater.removeListeners("download-complete");

  shell.openPath((await updater.checkForUpdatesAndDownload()).pathToUpdate);
});
```
### Events
Just like [electron-updater](https://www.npmjs.com/package/electron-updater), updater is event based.  
> These events are only fired on macOS as electron-updater's `.checkForUpdatesAndNotify()` is used on Windows.
  
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

Electron is not included in the npm package.

## Build
```sh
npm run build # => tsc
```
