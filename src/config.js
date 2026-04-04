import fs from 'fs';
import path from 'path';
import os from 'os';

const CONFIG_PATH = path.join(os.homedir(), '.weixin-mp-cli.json');

function readConfig() {
  if (!fs.existsSync(CONFIG_PATH)) return {};
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
}

function writeConfig(data) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

function getConfig() {
  const config = readConfig();
  if (!config.appid || !config.secret) {
    throw new Error('未找到配置，请先运行 weixin-mp-cli init 完成初始化');
  }
  return config;
}

export { readConfig, writeConfig, getConfig, CONFIG_PATH };
