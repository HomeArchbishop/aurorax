export const buildUrl = (baseUrl, path) => {
    return baseUrl.replace(/\/+$/, '') + '/' + path.replace(/^\/+/, '');
};
