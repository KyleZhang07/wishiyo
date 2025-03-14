/**
 * 客户端ID管理工具
 * 用于生成和获取唯一的客户端ID，使未登录用户也能使用系统
 */

const CLIENT_ID_KEY = 'wishiyo_client_id';

/**
 * 获取客户端ID，如果不存在则生成一个新的
 * @returns 客户端ID
 */
export function getClientId(): string {
  // 尝试从localStorage获取现有ID
  let clientId = localStorage.getItem(CLIENT_ID_KEY);
  
  // 如果不存在，生成一个新的UUID
  if (!clientId) {
    clientId = generateUUID();
    localStorage.setItem(CLIENT_ID_KEY, clientId);
  }
  
  return clientId;
}

/**
 * 生成一个UUID v4
 * @returns UUID字符串
 */
function generateUUID(): string {
  // 简单的UUID v4实现
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
