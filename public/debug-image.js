// 调试脚本：检查推荐卡片中的图片 URL
console.log('=== 图片加载调试 ===')

// 1. 检查所有 LazyImage 组件的 src 属性
setTimeout(() => {
  const images = document.querySelectorAll('.lazy-image-container')
  console.log(`找到 ${images.length} 个 LazyImage 组件`)

  images.forEach((img, index) => {
    const actualImg = img.querySelector('image')
    if (actualImg) {
      console.log(`图片 ${index}:`, {
        src: actualImg.getAttribute('src'),
        class: actualImg.className,
        display: window.getComputedStyle(img).display
      })
    }
  })
}, 2000)

// 2. 监听网络请求
const originalFetch = window.fetch
window.fetch = function(...args) {
  const url = args[0]
  if (typeof url === 'string' && url.includes('unsplash')) {
    console.log('图片请求:', url)
  }
  return originalFetch.apply(this, args)
}
