// pages/index/index.js
Page({
  data: {
    celebrities: [],
    loading: true
  },

  onLoad: function () {
    this.loadCelebrityData()
  },

  // 加载名人数据
  async loadCelebrityData() {
    try {
      wx.showLoading({
        title: '加载中...',
      })

      const db = wx.cloud.database()
      const celebritiesRes = await db.collection('celebrities').get()
      
      // 获取每个名人的书单
      const celebrities = await Promise.all(
        celebritiesRes.data.map(async celebrity => {
          const booksRes = await db.collection('books')
            .where({
              celebrityId: celebrity._id
            })
            .get()
          return {
            ...celebrity,
            books: booksRes.data
          }
        })
      )

      this.setData({
        celebrities,
        loading: false
      })

      wx.hideLoading()
    } catch (error) {
      console.error('加载数据失败：', error)
      wx.hideLoading()
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      })
    }
  },

  // 下拉刷新
  async onPullDownRefresh() {
    await this.loadCelebrityData()
    wx.stopPullDownRefresh()
  },

  // 滑动切换事件
  onSwiperChange(e) {
    const { current } = e.detail
    // 可以在这里添加切换效果或统计
  }
})
