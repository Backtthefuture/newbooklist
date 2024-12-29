# 名人书单小程序

这是一个展示名人推荐书单的微信小程序，采用现代化的苹果设计风格，通过优雅的左右滑动交互方式，为用户呈现各位名人的阅读推荐。

## 功能特点

### 1. 核心功能
- 左右滑动切换不同名人的书单
- 每页展示一位名人的完整书单
- 精美的视觉设计和流畅的交互体验

### 2. 信息展示
#### 名人信息
- 头像
- 姓名
- 个人简介

#### 推荐书籍
- 书籍封面图
- 书籍名称
- 出版社信息
- 作者信息
- 豆瓣评分
- 个性化推荐语

## 技术架构

### 前端实现
- 使用微信小程序原生框架开发
- 采用 Swiper 组件实现左右滑动功能
- 使用 Flex 布局实现响应式界面

### 后端服务
- 使用微信云开发
- 云数据库存储名人和书籍信息
- 云存储保存图片资源

### 数据结构
```javascript
// 名人信息
{
  id: String,          // 唯一标识
  name: String,        // 姓名
  avatar: String,      // 头像URL
  introduction: String // 个人简介
}

// 书籍信息
{
  id: String,           // 唯一标识
  title: String,        // 书名
  cover: String,        // 封面图URL
  publisher: String,    // 出版社
  author: String,       // 作者
  doubanScore: Number,  // 豆瓣评分
  recommendation: String // 推荐语
  celebrityId: String   // 关联的名人ID
}
```

## 项目结构
```
miniprogram/
  ├── pages/                # 页面文件
  │   └── index/           # 主页面
  ├── components/          # 自定义组件
  ├── images/             # 图片资源
  └── utils/              # 工具函数
cloudfunctions/            # 云函数
  └── initTestData/       # 初始化测试数据
```

## 使用说明
1. 打开小程序，默认展示第一位名人的书单
2. 左右滑动切换不同名人的书单
3. 点击书籍可查看详细信息

## 开发计划
1. 基础框架搭建
2. 界面设计实现
3. 数据结构设计
4. 云开发环境配置
5. 数据管理功能实现
6. 交互功能开发
7. 性能优化
8. 测试与发布

## 注意事项
- 图片资源需要经过压缩处理，确保加载速度
- 需要处理网络状态异常的情况
- 注意小程序的页面大小限制
