Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    book: {
      type: Object,
      value: {}
    }
  },

  methods: {
    preventDefault() {
      // 阻止冒泡，防止点击内容区域时关闭弹窗
      return false
    },

    onClose() {
      this.triggerEvent('close')
    },

    async onBuy() {
      try {
        const db = wx.cloud.database()
        const _ = db.command
        
        // 先更新点击数
        await db.collection('books')
          .doc(this.data.book._id)
          .update({
            data: {
              clickCount: _.inc(1)  // 增加购买按钮点击数
            }
          })
        
        // 获取最新统计数据
        const { data } = await db.collection('books')
          .doc(this.data.book._id)
          .field({
            clickCount: true,
            confirmCount: true
          })
          .get()
        
        // 显示提示
        wx.showModal({
          title: '购买提示',
          content: `你是第${data.clickCount}个想买这本书的朋友，其中有${data.confirmCount || 0}人确认想买，你是真的想买这本书么？`,
          confirmText: '是的',
          cancelText: '再想想',
          success: async (res) => {
            if (res.confirm) {
              try {
                // 更新确认数
                await db.collection('books')
                  .doc(this.data.book._id)
                  .update({
                    data: {
                      confirmCount: _.inc(1)  // 增加确认次数
                    }
                  })
                
                wx.showToast({
                  title: '谢谢！人多了会很快加上！',
                  icon: 'none',
                  duration: 2000
                })
              } catch (error) {
                console.error('更新确认数失败：', error)
                wx.showToast({
                  title: '操作失败',
                  icon: 'error'
                })
              }
            }
          }
        })
      } catch (error) {
        console.error('操作失败：', error)
        wx.showToast({
          title: '操作失败',
          icon: 'error'
        })
      }
    }
  }
})
