import CryptoJS from 'crypto-js';

/**
 * 密码加密工具
 * 前端使用 SHA256 加密密码后传输给后端
 * 后端再使用 PBKDF2 进行二次加密存储
 */
export class CryptoUtil {
  /**
   * 加密密码
   * @param password 明文密码
   * @returns SHA256 加密后的密码
   */
  static encryptPassword(password: string): string {
    return CryptoJS.SHA256(password).toString();
  }
}
