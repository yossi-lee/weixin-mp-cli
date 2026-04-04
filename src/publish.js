import axios from 'axios';
import { getAccessToken } from './auth.js';

async function publishDraft(mediaId) {
  const token = await getAccessToken();
  const response = await axios.post(
    `https://api.weixin.qq.com/cgi-bin/freepublish/submit?access_token=${token}`,
    { media_id: mediaId }
  );

  const { publish_id, errcode, errmsg } = response.data;
  if (errcode) throw new Error(`发布失败: [${errcode}] ${errmsg}`);

  return publish_id;
}

export { publishDraft };
