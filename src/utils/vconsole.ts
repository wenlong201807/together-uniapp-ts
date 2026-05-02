/**
 * vConsole 调试工具配置
 * 通过后端接口控制是否启用
 */

import VConsole from 'vconsole'

let vConsole: VConsole | null = null

/**
 * 初始化 vConsole
 * @param enabled 是否启用（从后端配置获取）
 */
export function initVConsole(enabled: boolean = false) {
  // #ifdef H5
  if (enabled) {
    if (!vConsole) {
      vConsole = new VConsole({
        theme: 'dark',
        defaultPlugins: ['system', 'network', 'element', 'storage'],
        maxLogNumber: 1000,
        onReady: () => {
          console.log('[vConsole] 调试工具已启动')
        },
      })
      console.log('[vConsole] 初始化成功')
    }
  } else {
    // 如果配置为关闭，销毁已存在的实例
    destroyVConsole()
  }
  // #endif
}

/**
 * 销毁 vConsole
 */
export function destroyVConsole() {
  // #ifdef H5
  if (vConsole) {
    vConsole.destroy()
    vConsole = null
    console.log('[vConsole] 已销毁')
  }
  // #endif
}

/**
 * 显示 vConsole
 */
export function showVConsole() {
  // #ifdef H5
  if (vConsole) {
    vConsole.show()
  }
  // #endif
}

/**
 * 隐藏 vConsole
 */
export function hideVConsole() {
  // #ifdef H5
  if (vConsole) {
    vConsole.hide()
  }
  // #endif
}

/**
 * 获取 vConsole 实例
 */
export function getVConsole() {
  return vConsole
}
