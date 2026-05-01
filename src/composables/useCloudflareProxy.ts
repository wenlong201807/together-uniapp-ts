// Cloudflare Workers 图片代理 Composable

import { ref, computed } from 'vue'
import {
  convertToHttpsUrl,
  convertUrls,
  convertImageFields,
  needsProxy,
  getOriginalUrl
} from '@/utils/cloudflare-proxy'

export function useCloudflareProxy() {
  /**
   * 转换单个 URL
   */
  const convertUrl = (url: string): string => {
    return convertToHttpsUrl(url)
  }

  /**
   * 转换 URL 数组
   */
  const convertUrlList = (urls: string[]): string[] => {
    return convertUrls(urls)
  }

  /**
   * 转换对象中的图片字段
   */
  const convertObject = <T extends Record<string, any>>(
    obj: T,
    imageFields: (keyof T)[]
  ): T => {
    return convertImageFields(obj, imageFields)
  }

  /**
   * 检查是否需要代理
   */
  const checkNeedsProxy = (url: string): boolean => {
    return needsProxy(url)
  }

  /**
   * 获取原始 URL
   */
  const extractOriginalUrl = (proxyUrl: string): string => {
    return getOriginalUrl(proxyUrl)
  }

  /**
   * 响应式转换单个 URL
   */
  const useConvertUrl = (url: string | (() => string)) => {
    return computed(() => {
      const urlValue = typeof url === 'function' ? url() : url
      return convertUrl(urlValue)
    })
  }

  /**
   * 响应式转换 URL 数组
   */
  const useConvertUrls = (urls: string[] | (() => string[])) => {
    return computed(() => {
      const urlsValue = typeof urls === 'function' ? urls() : urls
      return convertUrlList(urlsValue)
    })
  }

  return {
    // 基础方法
    convertUrl,
    convertUrlList,
    convertObject,
    checkNeedsProxy,
    extractOriginalUrl,

    // 响应式方法
    useConvertUrl,
    useConvertUrls
  }
}
