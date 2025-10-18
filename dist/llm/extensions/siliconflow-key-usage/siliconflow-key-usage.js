import axios from 'axios';
import { buildUrl } from '../../../internal/utils/url';
export class SiliconflowKeyUsage {
    static async usage(apiHost, keys) {
        return await Promise.all(keys.map(async (key, keyIndex) => {
            try {
                const resp = await SiliconflowKeyUsage.#makeUsageRequest(apiHost, key);
                return {
                    keyIndex,
                    key,
                    balance: Number(resp.data.data.balance),
                    unit: 'r',
                    balanceStr: `${resp.data.data.balance}r`,
                };
            }
            catch (err) {
                throw SiliconflowKeyUsage.#handleUsageError(err, key, keyIndex);
            }
        }));
    }
    static async #makeUsageRequest(apiHost, key) {
        return await axios.request({
            url: buildUrl(apiHost, 'user/info'),
            method: 'GET',
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${key}`,
                'Content-Type': 'application/json',
            },
        });
    }
    static #handleUsageError(err, key, keyIndex) {
        if (axios.isAxiosError(err) && err.response !== undefined) {
            return new Error(`@llmUsageRequest [${err.message}] ${err.response.data.message ?? ''} (key: #${keyIndex} ${key.slice(0, 6)}...)`);
        }
        return new Error(`@llmUsageRequest ${err?.message ?? String(err)}`);
    }
}
