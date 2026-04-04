import axios from 'axios';
import { getAccessToken } from './auth.js';

async function addDraft(article) {
  const token = await getAccessToken();

  const articlePayload = {
    article_type: 'news',
    title: article.title,
    author: article.author || '',
    digest: article.digest || '',
    content: article.content,
    content_source_url: article.content_source_url || '',
    need_open_comment: article.need_open_comment ?? 0,
    only_fans_can_comment: 0,
  };

  if (article.thumb_media_id) {
    articlePayload.thumb_media_id = article.thumb_media_id;
  }

  const response = await axios.post(
    `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${token}`,
    { articles: [articlePayload] }
  );

  const { media_id, errcode, errmsg } = response.data;
  if (errcode) throw new Error(`新增草稿失败: [${errcode}] ${errmsg}`);

  return media_id;
}

async function listDrafts(offset = 0, count = 20, no_content = 1) {
  const token = await getAccessToken();
  const response = await axios.post(
    `https://api.weixin.qq.com/cgi-bin/draft/batchget?access_token=${token}`,
    { offset, count, no_content }
  );

  const { item, total_count, errcode, errmsg } = response.data;
  if (errcode) throw new Error(`获取草稿列表失败: [${errcode}] ${errmsg}`);

  return { items: item, total: total_count };
}

async function deleteDraft(mediaId) {
  const token = await getAccessToken();
  const response = await axios.post(
    `https://api.weixin.qq.com/cgi-bin/draft/delete?access_token=${token}`,
    { media_id: mediaId }
  );

  const { errcode, errmsg } = response.data;
  if (errcode) throw new Error(`删除草稿失败: [${errcode}] ${errmsg}`);
}

export { addDraft, listDrafts, deleteDraft };
