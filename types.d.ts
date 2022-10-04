type UpdateEvent = "checking-for-update" | "update-available" | "update-not-available" | "download-in-progress" | "download-complete" | "error";

interface ListenerHandlerOptions {
  release?: Release;
  error?: Error;
}


declare class EventEmitter {
  public on(event: "checking-for-update", handler: () => void): void;
  public on(event: "update-available", handler: (release: Release) => void): void;
  public on(event: "update-not-available", handler: () => void): void;
  public on(event: "download-in-progress", handler: () => void): void;
  public on(event: "download-complete", handler: () => void): void;
  public on(event: "error", handler: (error: Error) => void): void;

  public fire(event: "checking-for-update");
  public fire(event: "update-available", release: Release);
  public fire(event: "update-not-available");
  public fire(event: "download-in-progress");
  public fire(event: "download-complete");
  public fire(event: "error", error: Error);
}

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
  label: string;
  size: number;
  browser_download_url: string;
}
