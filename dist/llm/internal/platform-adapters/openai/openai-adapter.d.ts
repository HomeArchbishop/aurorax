import { type AxiosResponse } from 'axios';
import type { AdapterCompletionsParams, PlatformAdapter } from '../../../../llm/internal/platform-adapters/interface.js';
export declare class OpenaiAdapter implements PlatformAdapter {
    completions(params: AdapterCompletionsParams): Promise<AxiosResponse>;
}
//# sourceMappingURL=openai-adapter.d.ts.map