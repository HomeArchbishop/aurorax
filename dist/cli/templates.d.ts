export type TemplateType = 'js' | 'ts';
export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';
export declare const templateTypes: TemplateType[];
export declare const packageManagers: PackageManager[];
export declare function entryTemplate(name: string, type: TemplateType, includeWebhook?: boolean): string;
export declare function pkgTemplate(name: string, type: TemplateType, pm?: PackageManager): string;
export declare function readmeTemplate(pm?: PackageManager): string;
export declare function napcatStartScriptTemplate(pm: PackageManager, entry: string): {
    sh: string;
    ps1: string;
};
export declare function napcatReadmeTemplate(): string;
//# sourceMappingURL=templates.d.ts.map