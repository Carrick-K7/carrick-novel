# Carrick Novel Tech Spec

> **PTT Version**: V3  
> **状态**: v1.0.0 已上线  
> **更新时间**: 2026-02-19 (东八区)

---

## 技术栈

- **框架**: Vue3 + Vite
- **语言**: TypeScript
- **构建**: Vite
- **部署**: Caddy 静态文件服务

---

## 架构设计

```
carrick-novel/
├── src/
│   ├── App.vue              # 根组件
│   ├── main.ts              # 入口
│   └── views/
│       └── Home.vue         # 阅读器主组件
├── public/
│   ├── novels/              # 小说章节文件
│   └── novels.json          # 书籍元数据
├── scripts/                 # 同步脚本
└── dist/                    # 构建输出
```

---

## 核心功能实现

### 阅读进度记忆
- 使用 localStorage 存储 `novel-reading-position`
- 记录: novelId、chapterIndex、timestamp
- 自动保存: 切换章节、页面卸载时

### 移动端适配
- 响应式布局（CSS Media Query）
- 触摸优化（按钮尺寸、滑动）
- iOS Safari 适配（safe-area）

### 数据同步
- Python 脚本从上游仓库同步
- 生成 novels.json 索引
- GitHub Actions 定时执行

---

## 部署配置

```caddy
novel.carrick7.com {
    root * /var/www/carrick-novel
    file_server
    try_files {path} /index.html
}
```

---

*Carrick Team | 2026-02-19*
