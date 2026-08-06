import { Preset } from './preset.js';
import { type ReplyRequestSplits } from './share.js';
export type PresetPreprocessorFn = (preset: Preset) => Promise<void>;
export type ReplyProcessorFn = (splits: ReplyRequestSplits[]) => Promise<ReplyRequestSplits[]>;
export declare function createPresetPreprocessor(p: PresetPreprocessorFn): PresetPreprocessorFn;
export declare function createReplyProcessor(p: ReplyProcessorFn): ReplyProcessorFn;
//# sourceMappingURL=processor.d.ts.map