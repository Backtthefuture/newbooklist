// pages/index/index.js
const app = getApp()

Page({
  data: {
    celebrities: [],
    isScrolled: false,
    currentIndex: 0,
    loading: true
  },

  onLoad: function() {
    this.loadCelebrityData()
  },

  async loadCelebrityData() {
    wx.showLoading({
      title: '加载中...',
    })

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

      this.setData({
        celebrities: celebritiesWithBooks,
        loading: false
      })
    } catch (error) {
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
      console.error('加载数据失败：', error)
    } finally {
      wx.hideLoading()
    }
  },

  onPullDownRefresh: async function() {
    await this.loadCelebrityData()
    wx.stopPullDownRefresh()
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
    this.setData({
      currentIndex: current,
      isScrolled: false
    })
  },

  onTapBook: function(e) {
    const { bookId } = e.currentTarget.dataset
    // 这里可以添加点击书籍的处理逻辑
    console.log('点击了书籍：', bookId)
  }
})
