import axios, {} from 'axios';
import { buildUrl } from '../../../../internal/utils/url.js';
export class OpenaiAdapter {
    async completions(params) {
        return await axios.request({
            url: buildUrl(params.apiHost, 'chat/completions'),
            method: 'POST',
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${params.key}`,
                'Content-Type': 'application/json',
                ...params.additionalHeaders,
            },
            data: {
                model: params.data.model,
                messages: params.data.messages,
                stream: false,
                temperature: params.data.temperature,
                top_p: params.data.topP,
            },
        });
    }
}
