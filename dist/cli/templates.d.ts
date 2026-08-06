export type TemplateType = 'js' | 'ts';
export declare const templateTypes: TemplateType[];
export declare function entryTemplate(name: string, type: TemplateType, includeWebhook?: boolean): string;
export declare function pkgTemplate(name: string, type: TemplateType): string;
export declare const readmeTemplate: () => string;
//# sourceMappingURL=templates.d.ts.map