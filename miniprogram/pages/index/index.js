// pages/index/index.js
const app = getApp()

// 存储键名
const LAST_VIEWED_KEY = 'last_viewed_celebrity'
const REFRESH_THROTTLE = 1000 // 刷新节流时间（毫秒）

Page({
  data: {
    celebrities: [],
    isScrolled: false,
    currentIndex: 0,
    loading: true,
    isAdmin: false,
    lastRefreshTime: 0,
    isRefreshing: false, // 是否正在刷新
    showBookDetail: false, // 控制书籍详情弹窗
    currentBook: null, // 当前选中的书籍
    animation: wx.createAnimation({
      duration: 300,
      timingFunction: 'ease',
    })
  },

  onLoad: function(options) {
    // 检查权限状态
    if (app.globalData.adminChecked) {
      this.setData({ isAdmin: app.globalData.isAdmin })
    } else {
      app.adminReadyCallback = isAdmin => {
        this.setData({ isAdmin })
      }
    }
    
    this.loadCelebrityData().then(() => {
      // 数据加载完成后处理分享进入
      this.handleShareEnter()
    })
  },

  onShow: function() {
    if (app.globalData.adminChecked) {
      this.setData({ isAdmin: app.globalData.isAdmin })
    }
  },

  // 获取随机名人索引
  getRandomIndex() {
    const { celebrities, currentIndex } = this.data
    if (celebrities.length <= 1) return currentIndex

    // 获取上次查看的ID
    const lastViewedId = wx.getStorageSync(LAST_VIEWED_KEY)
    const currentId = celebrities[currentIndex]?._id
    
    // 过滤可选的名人（排除当前和上次查看的）
    const availableIndices = celebrities
      .map((c, index) => ({ id: c._id, index }))
      .filter(({ id, index }) => 
        index !== currentIndex && 
        id !== lastViewedId
      )
      .map(({ index }) => index)

    // 如果没有其他选择，则从所有名人中随机（除了当前的）
    if (availableIndices.length === 0) {
      const allIndices = celebrities
        .map((_, index) => index)
        .filter(i => i !== currentIndex)
      
      if (allIndices.length === 0) return currentIndex
      return allIndices[Math.floor(Math.random() * allIndices.length)]
    }

    // 随机选择一个索引
    return availableIndices[Math.floor(Math.random() * availableIndices.length)]
  },

  // 切换到指定名人
  switchToCelebrity(index) {
    if (index === this.data.currentIndex) return
    
    const { celebrities } = this.data
    if (!celebrities[index]) return

    // 保存当前查看的名人ID
    wx.setStorageSync(LAST_VIEWED_KEY, celebrities[index]._id)

    // 使用渐变动画切换
    this.data.animation.opacity(0).step()
    this.setData({
      animationData: this.data.animation.export()
    })

    setTimeout(() => {
      this.setData({
        currentIndex: index
      }, () => {
        this.data.animation.opacity(1).step()
        this.setData({
          animationData: this.data.animation.export()
        })
      })
    }, 300)
  },

  async loadCelebrityData() {
    // 如果不是刷新触发的加载，显示loading
    if (!this.data.isRefreshing) {
      wx.showLoading({
        title: '加载中...',
      })
    }

    try {
      const db = wx.cloud.database()
      const { data: celebrities } = await db.collection('celebrities').get()
      
      // 获取每个名人的书单
      const celebritiesWithBooks = await Promise.all(
        celebrities.map(async celebrity => {
          const { data: books } = await db.collection('books')
            .where({
              celebrityId: celebrity._id
            })
            .get()
          return {
            ...celebrity,
            books
          }
        })
      )

      // 设置数据
      this.setData({
        celebrities: celebritiesWithBooks,
        loading: false
      }, () => {
        // 首次加载时随机选择一个名人
        if (this.data.currentIndex === 0) {
          const randomIndex = this.getRandomIndex()
          this.switchToCelebrity(randomIndex)
        }
      })
    } catch (error) {
      console.error('加载数据失败：', error)
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
    } finally {
      if (!this.data.isRefreshing) {
        wx.hideLoading()
      }
      // 结束刷新状态
      if (this.data.isRefreshing) {
        this.setData({ isRefreshing: false })
      }
    }
  },

  // 处理下拉刷新
  async onRefresh() {
    // 检查刷新节流
    const now = Date.now()
    if (now - this.data.lastRefreshTime < REFRESH_THROTTLE) {
      this.setData({ isRefreshing: false })
      return
    }
    
    this.setData({ 
      lastRefreshTime: now,
      isRefreshing: true
    })

    // 随机切换到另一个名人
    const randomIndex = this.getRandomIndex()
    this.switchToCelebrity(randomIndex)
    
    // 刷新数据
    await this.loadCelebrityData()
  },

  onScroll: function(e) {
    const scrollTop = e.detail.scrollTop
    const isScrolled = scrollTop > 100

    if (this.data.isScrolled !== isScrolled) {
      this.setData({
        isScrolled
      })
    }
  },

  onSwiperChange: function(e) {
    const { current } = e.detail
    // 手动滑动时也保存查看记录
    const celebrity = this.data.celebrities[current]
    if (celebrity) {
      wx.setStorageSync(LAST_VIEWED_KEY, celebrity._id)
    }
    this.setData({
      currentIndex: current
    })
  },

  // 处理书籍点击
  onTapBook(e) {
    const book = e.currentTarget.dataset.book
    if (book) {
      this.setData({
        currentBook: book,
        showBookDetail: true
      })
    }
  },

  // 关闭书籍详情
  onCloseBookDetail() {
    this.setData({
      showBookDetail: false,
      currentBook: null
    })
  },

  // 分享到聊天
  onShareAppMessage: function () {
    const { celebrities, currentIndex } = this.data
    const currentCelebrity = celebrities[currentIndex]
    
    if (!currentCelebrity) return {
      title: '发现一个很棒的读书小程序',
      path: '/pages/index/index'
    }

    return {
      title: `${currentCelebrity.name}的推荐书单`,
      path: `/pages/index/index?celebrityId=${currentCelebrity._id}`,
      imageUrl: currentCelebrity.avatar // 使用名人头像作为分享图片
    }
  },

  // 分享到朋友圈
  onShareTimeline: function () {
    const { celebrities, currentIndex } = this.data
    const currentCelebrity = celebrities[currentIndex]
    
    if (!currentCelebrity) return {
      title: '发现一个很棒的读书小程序',
      query: ''
    }

    return {
      title: `${currentCelebrity.name}推荐了${currentCelebrity.books?.length || 0}本好书，快来看看吧`,
      query: `celebrityId=${currentCelebrity._id}`,
      imageUrl: currentCelebrity.avatar
    }
  },

  // 处理分享进入
  async handleShareEnter() {
    const scene = this.options.scene
    const celebrityId = this.options.celebrityId
    
    if (!celebrityId) return
    
    // 查找对应的名人索引
    const index = this.data.celebrities.findIndex(c => c._id === celebrityId)
    if (index !== -1) {
      this.switchToCelebrity(index)
    }
  },

  // 处理分享按钮点击
  onTapShare() {
    const { celebrities, currentIndex } = this.data
    const currentCelebrity = celebrities[currentIndex]
    
    if (!currentCelebrity) return
    
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  }
})
