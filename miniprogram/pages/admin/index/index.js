const app = getApp()

Page({
  data: {
    celebrities: [],
    loading: false
  },

  onLoad() {
    this.loadData()
  },

  onPullDownRefresh() {
    this.loadData()
  },

  async loadData() {
    this.setData({ loading: true })
    
    try {
      const db = wx.cloud.database()
      
      // 获取所有名人数据
      const { data: celebrities } = await db.collection('celebrities').get()
      
      // 为每个名人获取其书籍数据
      const celebritiesWithBooks = await Promise.all(
        celebrities.map(async celebrity => {
          const { data: books } = await db.collection('books')
            .where({
              celebrityId: celebrity._id
            })
            .get()
          return {
            ...celebrity,
            books,
            showBooks: false // 控制书单的展开/收起
          }
        })
      )

      this.setData({
        celebrities: celebritiesWithBooks
      })
    } catch (error) {
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
      console.error('加载数据失败：', error)
    } finally {
      this.setData({ loading: false })
      wx.stopPullDownRefresh()
    }
  },

  // 展开/收起书单
  onToggleBooks(e) {
    const { index } = e.currentTarget.dataset
    const { celebrities } = this.data
    celebrities[index].showBooks = !celebrities[index].showBooks
    this.setData({ celebrities })
  },

  // 添加名人
  onAddCelebrity() {
    wx.navigateTo({
      url: '/pages/admin/celebrity-edit/index'
    })
  },

  // 编辑名人
  onEdit(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/admin/celebrity-edit/index?id=${id}`
    })
  },

  // 删除名人
  async onDelete(e) {
    const { id } = e.currentTarget.dataset
    
    const res = await wx.showModal({
      title: '确认删除',
      content: '删除后将无法恢复，是否继续？',
      confirmText: '删除',
      confirmColor: '#FF6B6B'
    })

    if (res.confirm) {
      wx.showLoading({ title: '删除中...' })
      
      try {
        const db = wx.cloud.database()
        
        // 删除名人记录
        await db.collection('celebrities').doc(id).remove()
        
        // 删除关联的书籍记录
        await db.collection('books').where({
          celebrityId: id
        }).remove()

        // 刷新数据
        this.loadData()
        
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        })
      } catch (error) {
        wx.showToast({
          title: '删除失败',
          icon: 'error'
        })
        console.error('删除失败：', error)
      } finally {
        wx.hideLoading()
      }
    }
  },

  // 管理书籍
  onManageBooks(e) {
    const { celebrityId } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/admin/books/index?id=${celebrityId}`
    })
  },

  // 添加书籍
  onAddBook(e) {
    const { celebrityId } = e.currentTarget.dataset
    // TODO: 跳转到书籍编辑页面
    wx.showToast({
      title: '即将开发',
      icon: 'none'
    })
  },

  // 编辑书籍
  onEditBook(e) {
    const { id } = e.currentTarget.dataset
    // TODO: 跳转到书籍编辑页面
    wx.showToast({
      title: '即将开发',
      icon: 'none'
    })
  },

  // 删除书籍
  async onDeleteBook(e) {
    const { id } = e.currentTarget.dataset
    
    const res = await wx.showModal({
      title: '确认删除',
      content: '删除后将无法恢复，是否继续？',
      confirmText: '删除',
      confirmColor: '#FF6B6B'
    })

    if (res.confirm) {
      wx.showLoading({ title: '删除中...' })
      
      try {
        const db = wx.cloud.database()
        
        // 删除书籍记录
        await db.collection('books').doc(id).remove()

        // 刷新数据
        this.loadData()
        
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        })
      } catch (error) {
        wx.showToast({
          title: '删除失败',
          icon: 'error'
        })
        console.error('删除失败：', error)
      } finally {
        wx.hideLoading()
      }
    }
  }
})
