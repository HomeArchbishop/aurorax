import { type AxiosResponse } from 'axios';
import type { AdapterCompletionsParams, PlatformAdapter } from '../../../../llm/internal/platform-adapters/interface.js';
export declare class SiliconflowAdapter implements PlatformAdapter {
    completions(params: AdapterCompletionsParams): Promise<AxiosResponse>;
}
//# sourceMappingURL=siliconflow-adapter.d.ts.map