# T-026: Novel PWA + 离线缓存

## 目标
将 Novel 项目转换为 PWA，支持离线缓存阅读

## 背景
用户需要在 iOS 上像原生 App 一样使用，并支持离线阅读

## 需求

### 功能需求
- [x] PWA 配置（manifest、Service Worker）
- [x] 离线缓存（已读章节）
- [x] 添加到主屏支持
- [x] 离线/在线状态提示

### 技术方案
- vite-plugin-pwa 插件
- Workbox 缓存策略
- CacheFirst 缓存章节内容

## 执行步骤
- [x] 安装 vite-plugin-pwa
- [x] 配置 vite.config.ts
- [x] 生成 PWA 图标
- [x] 添加网络状态检测
- [x] 构建测试
- [ ] Git 提交推送（待SubAgent完成）
- [ ] 部署（待SubAgent完成）

## PWA 使用方法

### iOS 添加到主屏
1. Safari 打开 novel.carrick7.com
2. 点击底部"分享"按钮
3. 选择"添加到主屏幕"
4. 图标会出现在桌面，像原生 App 一样使用

### 离线阅读
- 阅读过的章节自动缓存
- 离线时自动显示已缓存内容
- 缓存有效期：30天

## 进度
| 时间 | 事件 | 状态 |
|:---:|:---|:---:|
| 2026-02-22 | Task 创建 | ✅ |
| 2026-02-22 | 功能开发 | 🟡 进行中 |

## 提交记录
- 待 SubAgent 完成后补充
