Page({
  data: {
    celebrityId: '', // 名人ID
    celebrity: {
      name: '',
      avatar: '',
      introduction: ''
    }, // 名人信息
    books: [], // 书籍列表
    isDragging: false, // 是否正在拖拽
    startY: 0, // 拖拽开始的Y坐标
    currentIndex: -1, // 当前拖拽的项目索引
    moveY: 0, // 当前移动的Y坐标
    dragStartTime: 0, // 开始拖动的时间戳
    dragThreshold: 5, // 拖动阈值（像素）
    dragDelay: 200, // 长按延时（毫秒）
  },

  onLoad(options) {
    console.log('书单页面接收到的参数：', options) // 添加日志
    if (options.id) {
      this.setData({ celebrityId: options.id })
      console.log('设置的 celebrityId:', options.id) // 添加日志
      this.loadData()
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'error'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  // 加载数据
  async loadData() {
    wx.showLoading({
      title: '加载中...'
    })

    try {
      console.log('开始调用云函数，celebrityId:', this.data.celebrityId) // 添加日志
      const { result } = await wx.cloud.callFunction({
        name: 'getBookList',
        data: {
          celebrityId: this.data.celebrityId
        }
      })
      
      console.log('云函数返回结果：', result) // 添加日志

      if (result && result.success) {
        const celebrity = result.data.celebrity || {
          name: '',
          avatar: '',
          introduction: ''
        }
        const books = result.data.books || []
        
        console.log('设置数据前：', { celebrity, books }) // 添加日志
        
        this.setData({
          celebrity,
          books
        })
        
        console.log('设置数据后：', this.data) // 添加日志
      } else {
        throw new Error(result?.message || '加载失败')
      }
    } catch (error) {
      console.error('加载数据失败：', error)
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'error'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 添加书籍
  onAddBook() {
    wx.navigateTo({
      url: `/pages/admin/book-edit/index?celebrityId=${this.data.celebrityId}`
    })
  },

  // 编辑书籍
  onEditBook(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/admin/book-edit/index?celebrityId=${this.data.celebrityId}&id=${id}`
    })
  },

  // 删除书籍
  async onDeleteBook(e) {
    const { id } = e.currentTarget.dataset
    const book = this.data.books.find(b => b._id === id)
    
    // 确认删除
    const { confirm } = await wx.showModal({
      title: '确认删除',
      content: `确定要删除《${book.title}》吗？`,
      confirmText: '删除',
      confirmColor: '#E53E3E'
    })
    
    if (!confirm) return
    
    wx.showLoading({ title: '删除中...' })
    
    try {
      const db = wx.cloud.database()
      await db.collection('books').doc(id).remove()
      
      // 更新列表
      this.setData({
        books: this.data.books.filter(b => b._id !== id)
      })
      
      wx.showToast({
        title: '删除成功',
        icon: 'success'
      })
      
    } catch (error) {
      console.error('删除失败：', error)
      wx.showToast({
        title: '删除失败',
        icon: 'error'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 开始拖拽
  onDragStart(e) {
    const { index } = e.currentTarget.dataset
    const startY = e.touches[0].clientY
    
    // 记录开始时间和位置
    this.setData({
      startY,
      moveY: startY,
      currentIndex: index,
      dragStartTime: Date.now()
    })

    // 延时设置拖动状态，以区分点击和拖动
    setTimeout(() => {
      if (this.data.currentIndex === index) {
        this.setData({ isDragging: true })
      }
    }, this.data.dragDelay)
  },

  // 拖拽中
  onDragMove(e) {
    if (!this.data.isDragging) return
    
    const moveY = e.touches[0].clientY
    const diffY = moveY - this.data.startY
    
    // 如果移动距离小于阈值，不处理
    if (Math.abs(diffY) < this.data.dragThreshold) return
    
    this.setData({ moveY })
    
    // 获取当前元素位置
    wx.createSelectorQuery()
      .selectAll('.book-item')
      .boundingClientRect(rects => {
        if (!rects) return
        
        // 计算目标位置
        const currentRect = rects[this.data.currentIndex]
        const currentCenterY = currentRect.top + currentRect.height / 2 + diffY
        
        // 找到目标位置
        let targetIndex = this.data.currentIndex
        rects.forEach((rect, index) => {
          const centerY = rect.top + rect.height / 2
          if (
            index !== this.data.currentIndex && 
            Math.abs(centerY - currentCenterY) < rect.height / 2
          ) {
            targetIndex = index
          }
        })
        
        // 如果位置变化，更新列表
        if (targetIndex !== this.data.currentIndex) {
          const books = [...this.data.books]
          const [movedItem] = books.splice(this.data.currentIndex, 1)
          books.splice(targetIndex, 0, movedItem)
          
          this.setData({
            books,
            currentIndex: targetIndex,
            startY: moveY // 更新起始位置，避免跳动
          })
        }
      })
      .exec()
  },

  // 结束拖拽
  async onDragEnd() {
    // 如果是点击（不是拖动），不处理
    if (Date.now() - this.data.dragStartTime < this.data.dragDelay) {
      this.setData({
        isDragging: false,
        currentIndex: -1
      })
      return
    }
    
    if (!this.data.isDragging) return
    
    this.setData({ 
      isDragging: false,
      currentIndex: -1
    })
    
    // 准备排序数据
    const orders = this.data.books.map((book, index) => ({
      id: book._id,
      order: index + 1
    }))
    
    // 调用云函数更新排序
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'updateBookOrder',
        data: {
          celebrityId: this.data.celebrityId,
          orders
        }
      })
      
      if (!result.success) {
        throw new Error(result.error || '更新排序失败')
      }
      
      // 刷新列表
      this.loadData()
      
    } catch (error) {
      console.error('更新排序失败：', error)
      wx.showToast({
        title: '排序保存失败',
        icon: 'error'
      })
    }
  },

  // 下载模板
  downloadTemplate() {
    const fileID = 'cloud://booklist-7go3r6z767e1cf6e.626f-booklist-7go3r6z767e1cf6e-1333022443/templates/batch_upload_template.xlsx';
    wx.cloud.downloadFile({
      fileID: fileID,
      success: res => {
        const filePath = res.tempFilePath;
        wx.openDocument({
          filePath: filePath,
          fileType: 'xlsx',
          showMenu: true,
          success: function () {
            console.log('打开文档成功');
          },
          fail: function(error) {
            console.error('打开文档失败', error);
            wx.showModal({
              title: '提示',
              content: '模板文件下载成功。由于小程序限制，请复制以下链接在浏览器中打开下载：\n' + fileID,
              showCancel: false
            });
          }
        });
      },
      fail: error => {
        console.error('下载失败', error);
        wx.showModal({
          title: '下载失败',
          content: '请稍后重试',
          showCancel: false
        });
      }
    });
  },

  // 批量上传
  async onBatchUpload() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['.xlsx', '.xls'],
      success: async (res) => {
        const tempFilePath = res.tempFiles[0].path;
        
        wx.showLoading({
          title: '正在上传...',
        });

        try {
          // 1. 上传Excel文件到云存储
          const uploadRes = await wx.cloud.uploadFile({
            cloudPath: `temp/${Date.now()}-${Math.random().toString(36).slice(-6)}.xlsx`,
            filePath: tempFilePath,
          });

          wx.showLoading({
            title: '正在解析...',
          });

          // 2. 调用云函数解析Excel
          const parseResult = await wx.cloud.callFunction({
            name: 'parseExcelFile',
            data: {
              fileID: uploadRes.fileID,
            }
          });

          if (!parseResult.result.success) {
            throw new Error(parseResult.result.message);
          }

          const books = parseResult.result.data;
          if (books.length === 0) {
            throw new Error('没有找到有效的书籍数据');
          }

          wx.showLoading({
            title: '正在导入...',
          });

          // 3. 调用批量导入云函数
          const importResult = await wx.cloud.callFunction({
            name: 'batchUploadBooks',
            data: {
              celebrityId: this.data.celebrityId,
              books: books
            }
          });

          if (importResult.result.success) {
            wx.showToast({
              title: importResult.result.message,
              icon: 'success'
            });
            this.loadData(); // 刷新列表
          } else {
            throw new Error(importResult.result.message);
          }

        } catch (error) {
          console.error('批量导入失败：', error);
          wx.showModal({
            title: '导入失败',
            content: error.message || '请稍后重试',
            showCancel: false
          });
        } finally {
          wx.hideLoading();
        }
      }
    });
  },

  // 页面显示时刷新数据
  onShow() {
    if (this.data.celebrityId) {
      this.loadData()
    }
  }
})
