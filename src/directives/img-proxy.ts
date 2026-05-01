// 图片代理指令 - 自动将 HTTP 图片 URL 转换为 HTTPS 代理 URL
import type { Directive } from 'vue'
import { convertToHttpsUrl } from '@/utils/cloudflare-proxy'

// 存储每个元素的观察器
const observerMap = new WeakMap<HTMLElement, MutationObserver>()

/**
 * v-img-proxy 指令
 * 用法：<image v-img-proxy="imageUrl" /> 或 <image v-img-proxy :src="imageUrl" />
 *
 * 功能：
 * 1. 自动拦截图片 src 属性
 * 2. 将 HTTP 七牛云 URL 转换为 HTTPS 代理 URL
 * 3. 支持单张图片和多张图片（v-for）场景
 * 4. 兼容 uni-app 的 image 组件
 */
export const imgProxy: Directive = {
  mounted(el, binding) {
    updateImageSrc(el, binding.value)
  },

  updated(el, binding) {
    // 只在值变化时更新
    if (binding.value !== binding.oldValue) {
      updateImageSrc(el, binding.value)
    }
  },

  unmounted(el) {
    // 清理观察器
    const observer = observerMap.get(el)
    if (observer) {
      observer.disconnect()
      observerMap.delete(el)
    }
  }
}

/**
 * 更新图片 src 属性
 */
function updateImageSrc(el: HTMLElement, url: string) {
  if (!url) {
    console.log('[v-img-proxy] URL 为空，跳过转换')
    return
  }

  console.log('[v-img-proxy] ========== 开始处理 ==========')
  console.log('[v-img-proxy] 原始 URL:', url)
  console.log('[v-img-proxy] 元素标签:', el.tagName)
  console.log('[v-img-proxy] 元素类名:', el.className)

  // 转换 URL
  const httpsUrl = convertToHttpsUrl(url)

  console.log('[v-img-proxy] 转换后 URL:', httpsUrl)
  console.log('[v-img-proxy] 是否发生转换:', url !== httpsUrl)

  // 方式1: 标准 img 标签
  if (el.tagName === 'IMG') {
    el.setAttribute('src', httpsUrl)
    console.log('[v-img-proxy] ✅ 已设置 src 属性到 IMG 元素')
    return
  }

  // 方式2: uni-app H5 编译后的结构 <uni-image>
  // 结构: <uni-image><div style="background-image: url(...)"></div><img></uni-image>
  if (el.tagName === 'UNI-IMAGE' || el.classList.contains('uni-image')) {
    // 设置 div 的 background-image
    const divElement = el.querySelector('div')
    if (divElement) {
      divElement.style.backgroundImage = `url("${httpsUrl}")`
      console.log('[v-img-proxy] ✅ 已设置 background-image 到 uni-image 的 div 子元素')
    }

    // 同时设置 img 的 src（如果存在）
    const imgElement = el.querySelector('img')
    if (imgElement) {
      imgElement.setAttribute('src', httpsUrl)
      console.log('[v-img-proxy] ✅ 已设置 src 属性到 uni-image 的 img 子元素')
    } else {
      // img 标签可能还未创建，使用 MutationObserver 监听
      console.log('[v-img-proxy] img 标签尚未创建，启动 MutationObserver 监听')
      setupMutationObserver(el, httpsUrl)
    }

    return
  }

  // 方式3: 查找子元素中的 uni-image
  const uniImage = el.querySelector('uni-image')
  if (uniImage) {
    console.log('[v-img-proxy] 找到子元素 uni-image')
    const divElement = uniImage.querySelector('div')
    if (divElement) {
      divElement.style.backgroundImage = `url("${httpsUrl}")`
      console.log('[v-img-proxy] ✅ 已设置 background-image 到子元素 uni-image > div')
    }

    const imgElement = uniImage.querySelector('img')
    if (imgElement) {
      imgElement.setAttribute('src', httpsUrl)
      console.log('[v-img-proxy] ✅ 已设置 src 属性到子元素 uni-image > img')
    } else {
      console.log('[v-img-proxy] img 标签尚未创建，启动 MutationObserver 监听')
      setupMutationObserver(uniImage as HTMLElement, httpsUrl)
    }

    return
  }

  // 方式4: 兼容原生 image 标签
  const imgElement = el.querySelector('img')
  if (imgElement) {
    imgElement.setAttribute('src', httpsUrl)
    console.log('[v-img-proxy] ✅ 已设置 src 属性到子元素 img')
    return
  }

  // 方式5: 直接设置 src 属性（兼容其他情况）
  if (el.tagName === 'IMAGE') {
    el.setAttribute('src', httpsUrl)
    console.log('[v-img-proxy] ✅ 已设置 src 属性到 IMAGE 元素')
    return
  }

  console.warn('[v-img-proxy] ❌ 未找到合适的图片元素，无法设置 URL')
  console.log('[v-img-proxy] 元素子节点:', Array.from(el.children).map(c => c.tagName).join(', '))
}

/**
 * 设置 MutationObserver 监听 img 标签的创建
 */
function setupMutationObserver(el: HTMLElement, httpsUrl: string) {
  // 如果已经有观察器，先断开
  const existingObserver = observerMap.get(el)
  if (existingObserver) {
    existingObserver.disconnect()
  }

  // 创建新的观察器
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        // 检查是否有新增的 img 标签
        mutation.addedNodes.forEach((node) => {
          if (node.nodeName === 'IMG') {
            const imgElement = node as HTMLImageElement
            imgElement.setAttribute('src', httpsUrl)
            console.log('[v-img-proxy] 🔄 MutationObserver: 检测到新增 img 标签，已设置 src')
            // 设置成功后断开观察器
            observer.disconnect()
            observerMap.delete(el)
          }
        })
      }
    }
  })

  // 开始观察
  observer.observe(el, {
    childList: true,
    subtree: true
  })

  // 保存观察器引用
  observerMap.set(el, observer)

  console.log('[v-img-proxy] 🔍 MutationObserver 已启动，等待 img 标签创建')
}

export default imgProxy
