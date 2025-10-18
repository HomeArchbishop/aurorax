export type MessageSend = string | MessageSegmentSend[] | MessageSegmentSend;
export type MessageReceive = string | MessageSegmentReceive[] | MessageSegmentReceive;
export type MessageSegmentSend = TextSegment | FaceSegment | ImageSegment | RecordSegment | VideoSegment | AtSegment | RpsSegment | DiceSegment | ShakeSegment | PokeSegment | AnonymousSegment | ShareSegment | ContactSegment | LocationSegment | MusicSegment | ReplySegment | NodeSegment | XmlSegment | JsonSegment;
export type MessageSegmentReceive = TextSegment | FaceSegment | ImageSegment | RecordSegment | VideoSegment | AtSegment | RpsSegment | DiceSegment | ShareSegment | ContactSegment | LocationSegment | ReplySegment | ForwardSegment | XmlSegment | JsonSegment;
export interface TextSegment {
    type: 'text';
    data: {
        text: string;
    };
}
export interface FaceSegment {
    type: 'face';
    data: {
        id: string;
    };
}
export interface ImageSegment {
    type: 'image';
    data: {
        file: string;
        type?: 'flash';
        sub_type?: 0 | 1;
        url?: string;
        cache?: '0' | '1';
        proxy?: '0' | '1';
        timeout?: number;
    };
}
export interface RecordSegment {
    type: 'record';
    data: {
        file: string;
        magic?: '0' | '1';
        url?: string;
        cache?: '0' | '1';
        proxy?: '0' | '1';
        timeout?: number;
    };
}
export interface VideoSegment {
    type: 'video';
    data: {
        file: string;
        url?: string;
        cache?: '0' | '1';
        proxy?: '0' | '1';
        timeout?: number;
    };
}
export interface AtSegment {
    type: 'at';
    data: {
        qq: string;
    };
}
export interface RpsSegment {
    type: 'rps';
    data: Record<string, unknown>;
}
export interface DiceSegment {
    type: 'dice';
    data: Record<string, unknown>;
}
export interface ShakeSegment {
    type: 'shake';
    data: Record<string, unknown>;
}
export interface PokeSegment {
    type: 'poke';
    data: {
        type: string;
        id: string;
        name?: string;
    };
}
export interface AnonymousSegment {
    type: 'anonymous';
    data: {
        ignore?: '0' | '1';
    };
}
export interface ShareSegment {
    type: 'share';
    data: {
        url: string;
        title: string;
        content?: string;
        image?: string;
    };
}
export interface ContactSegment {
    type: 'contact';
    data: {
        type: 'qq' | 'group';
        id: string;
    };
}
export interface LocationSegment {
    type: 'location';
    data: {
        lat: string;
        lon: string;
        title?: string;
        content?: string;
    };
}
export interface MusicSegment {
    type: 'music';
    data: {
        type: 'qq' | '163' | 'xm' | 'custom';
        id?: string;
        url?: string;
        audio?: string;
        title?: string;
        content?: string;
        image?: string;
    };
}
export interface ReplySegment {
    type: 'reply';
    data: {
        id: string;
    };
}
export interface ForwardSegment {
    type: 'forward';
    data: {
        id: string;
    };
}
export interface NodeSegment {
    type: 'node';
    data: {
        id?: string;
        user_id?: string;
        nickname?: string;
        content?: MessageSend;
    };
}
export interface XmlSegment {
    type: 'xml';
    data: {
        data: string;
    };
}
export interface JsonSegment {
    type: 'json';
    data: {
        data: string;
    };
}
//# sourceMappingURL=message.d.ts.map