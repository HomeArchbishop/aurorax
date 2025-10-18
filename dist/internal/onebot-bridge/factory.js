import { WsReverseOnebotBridge } from './ws-reverse';
export function createOnebotBridge(config) {
    switch (config.type) {
        case 'ws-reverse':
            return new WsReverseOnebotBridge(config);
    }
}
