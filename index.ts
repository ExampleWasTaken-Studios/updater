import { request } from "@octokit/request";
import fs from "fs";
import semver from "semver";
import download from "download";
import { autoUpdater } from "electron-updater";

type UpdateEvent = "checking-for-update" | "update-available" | "update-not-available" | "download-in-progress" | "download-complete" | "error";

type ListenerHandler = (error?: Error) => void;

interface Release {
  url: string;
  assets_url: string;
  id: number;
  tag_name: string;
  name: string;
  prerelease: boolean;
  assets: ReleaseAsset[];
}

interface ReleaseAsset {
  url: string;
  id: number;
  name: string;
  size: number;
  browser_download_url: string;
}

/**
 * Represents a listener that listens to a {@link UpdateEvent} and provides a {@link ListenerHandler} function that is execute whenever the even is fired.
 */
class Listener {
  /**
   * The {@link UpdateEvent} to listen for.
   */
  event: UpdateEvent;

  /**
   * The {@link ListenerHandler} that is executed whenever the `event` is fired.
   */
  handler: ListenerHandler;

  constructor(event: UpdateEvent, handler: ListenerHandler) {
    this.event = event;
    this.handler = handler;
  }
}

/**
 * An event emitter that handles the registering of {@link Listener} and firing of {@link UpdateEvent}s.
 */
abstract class EventEmitter {
  private listeners: Listener[] = [];

  /**
   * 
   * @param event The {@link UpdateEvent} the `handler` should be executed upon.
   * @param handler The {@link ListenerHandler} that is executed whenever the `event` is fired.
   */
  public on(event: UpdateEvent, handler: ListenerHandler) {
    this.listeners.push(new Listener(event, handler));
    console.log("listeners", this.listeners);
  }

  public removeListeners(event: UpdateEvent) {
    this.listeners = this.listeners.filter(current => current.event !== event);
    console.log(this.listeners);
  }

  /**
   * Fire an {@link UpdateEvent}.
   * @param event The {@link UpdateEvent} to fire.
   * @param error An {@link Error} that can be passed to the `error` event.
   */
  protected fire(event: UpdateEvent, error?: Error) {
    for (const current of this.listeners) {
      if (current.event === event) {
        current.handler(error);
      }
    }
  }
}

/**
 * The updater that handles checking, downloading and installing new updates.  
 * 
 * For Windows, this class utilizes [electron-updater](https://www.npmjs.com/package/electron-updater).  
 * On macOS, it downloads the new .dmg to the users download folder as auto updates via [electron-updater](https://www.npmjs.com/package/electron-updater) require applications to be signed.
 * @extends EventEmitter
 */
export class Updater extends EventEmitter {

  /**
   * The {@link Electron.App} you received the `ready` event from.
   */
  private app: Electron.App;

  /**
   * The name of the owner of the repository that hosts the updates.
   */
  private repoOwner: string;

  /**
   * The name of the repository that hosts the updates.
   */
  private repoName: string;

  /**
   * Whether to allow prereleases to be downloaded.
   */
  public allowPrereleases: boolean;

  /**
   * @param app The {@link Electron.App} you received the `ready` event from.
   * @param repoOwner The name of the owner of the repository that hosts the updates.
   * @param repoName The name of the repository that hosts the updates.
   * @param allowPrereleases Whether to allow prereleases to be downloaded.
   */
  constructor(app: Electron.App, repoOwner: string, repoName: string, allowPrereleases = false) {
    super();
    this.app = app;
    this.repoOwner = repoOwner;
    this.repoName = repoName;
    this.allowPrereleases = allowPrereleases;
  }

  /**
   * Check if updates are available and download them.  
   * 
   * For Windows, this class utilizes [electron-updater](https://www.npmjs.com/package/electron-updater).  
   * On macOS, it downloads the new .dmg to the users download folder as auto updates via [electron-updater](https://www.npmjs.com/package/electron-updater) require applications to be signed.
   * @returns `Promise<void>`
   */
  public async checkForUpdates(): Promise<void> {
    if (process.platform === "darwin") {
      const response = await request("GET /repos/{owner}/{repo}/releases", {
        owner: this.repoOwner,
        repo: this.repoName
      });

      const loadedReleases = this.convertToCustomReleases(response.data as unknown as Release[]); // Since the names of the keys of both the returned object and the custom Release interface are the same this works.

      for (const currentRelease of loadedReleases) {
        if (this.isValidVersion(currentRelease.tag_name)) {
          for (const currentAsset of currentRelease.assets) {
            if (/\.dmg$/.test(currentAsset.name)) {
              await this.downloadAsset(currentAsset);
              return;
            }
            continue;
          }
          this.fire("error", new Error("Cannot find suitable asset."));
          return;
        }
        continue;
      }
      this.fire("update-not-available");
    } else if (process.platform === "win32") {
      autoUpdater.checkForUpdatesAndNotify();
    }
  }

  private async downloadAsset(asset: ReleaseAsset): Promise<void> {
    this.fire("download-in-progress");
    const path = `${this.app.getPath("downloads")}/${asset.name}`;
    console.log(path);
    fs.writeFileSync(path, await download(asset.browser_download_url));
    this.fire("download-complete");
  }

  private isValidVersion(version: string): boolean {
    return semver.satisfies(version, `>${this.app.getVersion()}`, {
      includePrerelease: this.allowPrereleases
    });
  }

  private convertToCustomReleases(originalReleases: Release[]): Release[] {
    return originalReleases.map(current => {
      return {
        url: current.url,
        assets_url: current.assets_url,
        id: current.id,
        tag_name: current.tag_name,
        name: current.name,
        prerelease: current.prerelease,
        assets: current.assets
      };
    });
  }
}
