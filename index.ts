import { app as electronApp } from "electron";
import { request } from "@octokit/request";
import download from "download";
import semver from "semver";
import fs from "fs";

class Listener {
  event: UpdateEvent;
  handler: (args?: ListenerHandlerOptions) => void;

  constructor(event: UpdateEvent, handler: (args?: ListenerHandlerOptions) => void) {
    this.event = event;
    this.handler = handler;
  }
}

/**
 * Manages events and their listeners.
 */
class EventEmitter {
  private listeners: Listener[] = [];

  /**
   * Register a callback that should be executed whenever the `event` is fired.
   * @param event The {@link UpdateEvent} the callback should be executed upon.
   * @param handler The callback to execute on `event`.  
   * 
   * Callback shape:
   * ```ts
   * (args?: ListenerHandlerOptions) => void;
   * ```
   */
  public on(event: UpdateEvent, handler: (args?: ListenerHandlerOptions) => void): void {
    this.listeners.push({ event: event, handler:  handler });
  }

  /**
   * Fire an {@link UpdateEvent}.
   * @param event The {@link UpdateEvent} to fire.
   * @param args \{ release?: {@link Release}, error?: {@link Error} }
   */
  protected fire(event: UpdateEvent , args?: ListenerHandlerOptions): void {
    for (const current of this.listeners) {
      if (current.event === event) {
        current.handler(args);
      }
    }
  }
}

/**
 * The updater responsible for checking and downloading updates.
 * @extends EventEmitter {@link EventEmitter}
 */
export class Updater extends EventEmitter {

  private app: typeof electronApp;
  /**
   * The owner of the repository that hosts the update.  
   * Most of the time this will be the repository of your app.
   */
  public repoOwner: string;
  /**
   * The name of the repository that hosts the update.  
   * Most of the time this wil be the repository of your app.
   */
  public repoName: string;
  /**
   * If this option is set to true, you will always receive the latest update, no matter if it's stable or not. Is `false` by default.
   */
  public allowPrereleases;

  /**
   * @param repoOwner The owner of the repository that hosts the update (most of the time this will be the repository of your app).
   * @param repoName The name of the repository that hosts the update (most of the time this will be the repository of your app).
   * @param app The {@link Electron.App} interface of your app. It is important that you pass exactly the instane that you received the `ready`event from!
   * @param allowPrereleases If true, will download the latest update even if it is marked as prerelease.
   */
  constructor(repoOwner: string, repoName: string, app: typeof electronApp, allowPrereleases = false) {
    super();
    this.app = app;
    this.repoOwner = repoOwner;
    this.repoName = repoName;
    this.allowPrereleases = allowPrereleases;
  }

  /**
   * Checks if an update is available and downloads it into the appData directory.
   * @returns Promise\<void>
   */
  public async checkForUpdatesAndDownload(): Promise<void> {
    this.fire("checking-for-update");
    const response = await request("GET /repos/{owner}/{repo}/releases", {
      owner: this.repoOwner,
      repo: this.repoName
    });

    const loadedReleases = this.convertToCustomReleases(response.data as unknown as Release[]); // Since the names of the keys of both the returned object and the custom Release interface are the same this works.

    for (const currentRelease of loadedReleases) {
      if (this.isValidUpdate(currentRelease)) {
        this.fire("update-available", { release: currentRelease });
        for (const currentAsset of currentRelease.assets) {
          if (/\.exe$/.test(currentAsset.name) && process.platform === "win32" || /\.dmg$/.test(currentAsset.name) && process.platform === "darwin") {
            await this.downloadAsset(currentAsset);
            return;
          }
          continue;
        }
        this.fire("error", { error: new Error(`Cannot find suitable executable at ${currentRelease.url}`) });
        return;
      }
      continue;
    }
    this.fire("update-not-available");
  }

  private isValidUpdate(release: Release): boolean  {
    return semver.satisfies(release.tag_name, `>${this.app.getVersion()}`, {
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

  private async downloadAsset(asset: ReleaseAsset) {
    const path = this.app.isPackaged ? `${this.app.getPath("appData")}/${asset.name}` : `./${asset.name}`;
    this.fire("download-in-progress");
    fs.writeFileSync(path, await download(asset.browser_download_url));
    this.fire("download-complete");
  }
}

