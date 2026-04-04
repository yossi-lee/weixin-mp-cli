import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import { getAccessToken } from './auth.js';

async function uploadPermanentImage(imagePath) {
  const token = await getAccessToken();
  const form = new FormData();
  form.append('media', fs.createReadStream(imagePath), {
    filename: path.basename(imagePath),
  });

  const response = await axios.post(
    `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${token}&type=image`,
    form,
    { headers: form.getHeaders() }
  );

  const { media_id, url, errcode, errmsg } = response.data;
  if (errcode) throw new Error(`上传永久素材失败: [${errcode}] ${errmsg}`);

  return { media_id, url };
}

async function uploadArticleImage(imagePath) {
  const token = await getAccessToken();
  const form = new FormData();
  form.append('media', fs.createReadStream(imagePath), {
    filename: path.basename(imagePath),
  });

  const response = await axios.post(
    `https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=${token}`,
    form,
    { headers: form.getHeaders() }
  );

  const { url, errcode, errmsg } = response.data;
  if (errcode) throw new Error(`上传图文图片失败: [${errcode}] ${errmsg}`);

  return url;
}

async function listMaterials(type = 'image', offset = 0, count = 20) {
  const token = await getAccessToken();
  const response = await axios.post(
    `https://api.weixin.qq.com/cgi-bin/material/batchget_material?access_token=${token}`,
    { type, offset, count }
  );

  const { item, total_count, errcode, errmsg } = response.data;
  if (errcode) throw new Error(`获取素材列表失败: [${errcode}] ${errmsg}`);

  return { items: item, total: total_count };
}

async function deleteMaterial(mediaId) {
  const token = await getAccessToken();
  const response = await axios.post(
    `https://api.weixin.qq.com/cgi-bin/material/del_material?access_token=${token}`,
    { media_id: mediaId }
  );

  const { errcode, errmsg } = response.data;
  if (errcode) throw new Error(`删除素材失败: [${errcode}] ${errmsg}`);
}

async function getMaterialCount() {
  const token = await getAccessToken();
  const response = await axios.get(
    `https://api.weixin.qq.com/cgi-bin/material/get_materialcount?access_token=${token}`
  );

  const { image, voice, video, news, errcode, errmsg } = response.data;
  if (errcode) throw new Error(`获取素材统计失败: [${errcode}] ${errmsg}`);

  return { image, voice, video, news };
}

export { uploadPermanentImage, uploadArticleImage, listMaterials, deleteMaterial, getMaterialCount };
