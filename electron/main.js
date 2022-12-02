/* eslint-disable @typescript-eslint/no-var-requires */
const app = require("electron").app;
const { Updater } = require("../lib/index");

const log = console.log;

const REPO_OWNER = "";
const REPO_NAME = "";

app.on("ready", async () => {
  log("[electron] 'ready' event fired");
  const updater = new Updater(app, REPO_OWNER, REPO_NAME);

  updater.on("checking-for-update", () => log("checking for update"));
  updater.on("update-available", () => log("update available:"));
  updater.on("download-in-progress", () => log("download in progress"));
  updater.on("download-complete", () => log("download complete"));
  updater.on("update-not-available", () => log("update not available"));
  updater.on("error", (error) => log("an error occured:", error));

  updater.checkForUpdatesAndDownload();
});
