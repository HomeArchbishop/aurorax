interface OnebotConfig {
    port: number;
    token: string;
}
export declare const DEFAULT_ONEBOT_PORT = 3001;
export declare function detectPlatform(): NodeJS.Platform;
export declare function hasDocker(): boolean;
export declare function writeOnebotConfig(dir: string, config: OnebotConfig): Promise<string>;
export declare function writeDockerCompose(dir: string, port?: number): Promise<string>;
export declare function fetchLatestReleaseAsset(assetName: string): Promise<string>;
export declare function downloadFile(url: string, dest: string): Promise<void>;
export {};
//# sourceMappingURL=napcat.d.ts.map