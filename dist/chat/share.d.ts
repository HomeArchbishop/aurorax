import { type ApiRequest } from '../interfaces/onebot/req.js';
export type ReplyRequestSplits = string | Omit<ApiRequest, 'echo'>;
export interface DBKey {
    history: string;
    isShutup: string;
    equipment: string;
}
//# sourceMappingURL=share.d.ts.map