import type { OnebotBridge, OnebotBridgeConfig } from './interface'
import { WsOnebotBridge } from './ws'
import { WsReverseOnebotBridge } from './ws-reverse'

type AnyOnebotBridgeConfig = OnebotBridgeConfig<'ws'> | OnebotBridgeConfig<'ws-reverse'>

export function createOnebotBridge (config: AnyOnebotBridgeConfig): OnebotBridge {
  switch (config.type) {
    case 'ws':
      return new WsOnebotBridge(config)
    case 'ws-reverse':
      return new WsReverseOnebotBridge(config)
  }
}
