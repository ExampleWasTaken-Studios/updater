import { app } from "electron";
import { Updater } from "..";

const log = console.log;

const REPO_OWNER = "";
const REPO_NAME = "";

app.on("ready", () => {
  console.log("[electron] 'ready' event fired");
  const updater = new Updater(REPO_OWNER, REPO_NAME, app);

  updater.on("checking-for-update", () => log("checking for update"));
  updater.on("update-available", (args) => log("update available:", args?.release));
  updater.on("download-in-progress", () => log("donwload in progress"));
  updater.on("download-complete", () => log("download complete"));
  updater.on("update-not-available", () => log("update not available"));
  updater.on("error", (args) => log("an error occured:", args?.error));

  updater.checkForUpdatesAndDownload();

});
