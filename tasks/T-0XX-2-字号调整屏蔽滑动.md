# T-0XX-2: Novel 字号调整时屏蔽滑动换章

## 目标
优化 Novel 阅读体验：在调整字号时临时屏蔽滑动换章功能

## 问题
当前方案是调整滑动阈值（50→120px），但用户反馈应该在调整字号时直接屏蔽滑动换章

## 优化方案

### 实现逻辑
当用户打开字号调整面板时：
1. 临时禁用触摸滑动事件监听
2. 或添加标志位 `isAdjustingFontSize = true`
3. 在滑动事件处理中检查该标志，为 true 时不执行换章

当用户关闭字号调整面板时：
1. 恢复滑动事件监听
2. 或设置 `isAdjustingFontSize = false`

### 修改文件
- `Reader.vue` 或阅读器主组件
- `FontSizePanel.vue` 或字号调整面板组件

### 实现方式（参考）
```typescript
// 在 Reader.vue 中
const isFontSizePanelOpen = ref(false)

// 滑动事件处理
function handleSwipe(event) {
  if (isFontSizePanelOpen.value) {
    // 字号面板打开时，不执行换章
    return
  }
  // 正常处理滑动换章
}

// 字号面板打开/关闭时
function openFontSizePanel() {
  isFontSizePanelOpen.value = true
}

function closeFontSizePanel() {
  isFontSizePanelOpen.value = false
}
```

## 验收标准
- [ ] 字号面板打开时，滑动不触发换章
- [ ] 字号面板关闭时，滑动正常换章
- [ ] 滑动阈值恢复为原来设置（不需要120px）
- [ ] 构建成功
- [ ] Git提交推送
- [ ] 部署验证

## 进度
| 时间 | 事件 | 状态 |
|:---:|:---|:---:|
| 2026-02-22 | Task 创建 | ✅ |

## 提交记录
- 待添加
