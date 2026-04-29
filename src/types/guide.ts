// 引导步骤配置
export interface GuideStep {
  target: string // 目标元素选择器（class或id）
  title: string // 标题
  content: string // 内容描述
  placement: 'top' | 'bottom' | 'left' | 'right' // 提示位置
  highlightPadding?: number // 高亮区域padding，默认10
  nextText?: string // 下一步按钮文字
  skipText?: string // 跳过按钮文字
}

// 引导配置
export interface GuideConfig {
  id: string // 引导唯一标识
  version: string // 版本号
  steps: GuideStep[] // 引导步骤
  showOnce?: boolean // 是否只显示一次，默认true
}

// 元素位置信息
export interface ElementRect {
  top: number
  left: number
  width: number
  height: number
}
