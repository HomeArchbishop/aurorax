import type { OnebotBridge, OnebotBridgeConfig, OnebotBridgeType } from './interface'
import { WsReverseOnebotBridge } from './ws-reverse'

export function createOnebotBridge <B extends OnebotBridgeType> (config: OnebotBridgeConfig<B>): OnebotBridge {
  switch (config.type) {
    case 'ws-reverse':
      return new WsReverseOnebotBridge(config)
  }
}
