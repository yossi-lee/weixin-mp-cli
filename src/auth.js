import axios from 'axios';
import { getConfig } from './config.js';

let cachedToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const { appid, secret } = getConfig();
  const response = await axios.get('https://api.weixin.qq.com/cgi-bin/token', {
    params: { grant_type: 'client_credential', appid, secret },
  });

  const { access_token, expires_in, errcode, errmsg } = response.data;
  if (errcode) throw new Error(`获取 access_token 失败: [${errcode}] ${errmsg}`);

  cachedToken = access_token;
  tokenExpiresAt = Date.now() + (expires_in - 60) * 1000;

  return cachedToken;
}

export { getAccessToken };
