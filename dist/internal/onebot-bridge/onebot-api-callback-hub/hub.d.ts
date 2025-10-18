import type { OnebotApiResCallback } from '../interface';
import type { ApiResponseStatus, ApiResponse } from '../../../interfaces/onebot';
export declare class OnebotApiCallbackHub {
    #private;
    use(echo: string, okCb: OnebotApiResCallback<ApiResponseStatus.OK>, failedCb: OnebotApiResCallback<ApiResponseStatus.FAILED>): void;
    delete(echo: string): void;
    trigger(echo: string, res: ApiResponse): void;
}
//# sourceMappingURL=hub.d.ts.map