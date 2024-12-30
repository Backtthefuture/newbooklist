Page({
  data: {
    celebrityId: '', // 名人ID
    id: '', // 书籍ID（编辑模式）
    isEdit: false, // 是否是编辑模式
    title: '', // 书名
    author: '', // 作者
    doubanScore: '', // 豆瓣评分
    recommendation: '', // 推荐语
    coverUrl: '', // 封面URL
    tempCover: '', // 临时封面URL（本地）
    canSave: false, // 是否可以保存
    validation: {
      title: true,
      author: true,
      score: true,
      cover: true
    }
  },

  onLoad(options) {
    if (options.celebrityId) {
      this.setData({ 
        celebrityId: options.celebrityId,
        isEdit: !!options.id,
        id: options.id || ''
      })
      
      if (options.id) {
        this.loadBookData()
      }
    }
  },

  // 检查表单是否可以保存
  checkCanSave() {
    const { title, author, doubanScore, tempCover, coverUrl, validation } = this.data
    
    // 基础验证：标题和作者必填
    const hasBasicInfo = !!title.trim() && !!author.trim()
    
    // 封面验证：必须有封面（新上传的或已有的）
    const hasCover = !!tempCover || !!coverUrl
    
    // 评分验证：可选，但如果填写必须合法
    let hasValidScore = true
    if (doubanScore !== '') {
      const score = parseFloat(doubanScore)
      hasValidScore = !isNaN(score) && score >= 0 && score <= 10
    }
    
    // 更新验证状态
    this.setData({
      validation: {
        title: !!title.trim(),
        author: !!author.trim(),
        score: hasValidScore,
        cover: hasCover
      },
      canSave: hasBasicInfo && hasCover && hasValidScore
    })
  },

  // 加载书籍数据
  async loadBookData() {
    wx.showLoading({ title: '加载中...' })
    
    try {
      const db = wx.cloud.database()
      const { data: book } = await db.collection('books')
        .doc(this.data.id)
        .get()
      
      this.setData({
        title: book.title,
        author: book.author || '',
        doubanScore: book.doubanScore?.toString() || '',  
        recommendation: book.recommendation || '',
        coverUrl: book.coverUrl
      }, () => {
        this.checkCanSave() // 检查表单状态
      })
      
    } catch (error) {
      console.error('加载数据失败：', error)
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 选择封面
  async onChooseCover() {
    try {
      const { tempFilePaths } = await wx.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      })
      
      if (tempFilePaths && tempFilePaths[0]) {
        this.setData({
          tempCover: tempFilePaths[0]
        }, () => {
          this.checkCanSave() // 检查表单状态
        })
      }
      
    } catch (error) {
      console.error('选择图片失败：', error)
    }
  },

  // 上传封面
  async uploadCover() {
    if (!this.data.tempCover) {
      return this.data.coverUrl // 如果没有新封面，返回原封面
    }
    
    wx.showLoading({ title: '上传封面...' })
    
    try {
      const { fileID } = await wx.cloud.uploadFile({
        cloudPath: `books/${Date.now()}-${Math.random().toString(36).slice(-6)}.jpg`,
        filePath: this.data.tempCover
      })
      
      return fileID
      
    } catch (error) {
      console.error('上传封面失败：', error)
      throw new Error('上传封面失败')
    } finally {
      wx.hideLoading()
    }
  },

  // 输入书名
  onTitleInput(e) {
    this.setData({ title: e.detail.value }, () => {
      this.checkCanSave()
    })
  },

  // 输入作者
  onAuthorInput(e) {
    this.setData({ author: e.detail.value }, () => {
      this.checkCanSave()
    })
  },

  // 输入评分
  onScoreInput(e) {
    let value = e.detail.value
    // 只允许输入数字和小数点
    value = value.replace(/[^\d.]/g, '')
    // 不允许多个小数点
    const parts = value.split('.')
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('')
    }
    this.setData({ doubanScore: value }, () => {
      this.checkCanSave()
    })
  },

  // 评分输入框失焦时的处理
  onScoreBlur(e) {
    let value = this.data.doubanScore
    if (value) {
      // 转换为数字并验证范围
      let score = parseFloat(value)
      if (isNaN(score)) {
        score = ''
      } else {
        // 限制范围并格式化
        if (score < 0) score = 0
        if (score > 10) score = 10
        score = score.toFixed(1)
      }
      // 更新显示的值
      this.setData({ doubanScore: score }, () => {
        this.checkCanSave()
      })
      
      // 如果超出范围，提示用户
      if (value && (parseFloat(value) < 0 || parseFloat(value) > 10)) {
        wx.showToast({
          title: '评分已调整到0-10范围内',
          icon: 'none'
        })
      }
    }
  },

  // 输入推荐语
  onRecommendationInput(e) {
    this.setData({ recommendation: e.detail.value })
  },

  // 保存数据
  async onSave() {
    if (!this.data.canSave) {
      wx.showToast({
        title: '请完善必填信息',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '保存中...' })

    try {
      // 上传封面
      const coverUrl = await this.uploadCover()
      
      // 准备数据
      const bookData = {
        title: this.data.title.trim(),
        author: this.data.author.trim(),
        celebrityId: this.data.celebrityId,
        coverUrl: coverUrl || this.data.coverUrl,
        updateTime: new Date()
      }

      // 添加可选字段
      if (this.data.doubanScore) {
        bookData.doubanScore = parseFloat(this.data.doubanScore)
      }
      if (this.data.recommendation) {
        bookData.recommendation = this.data.recommendation.trim()
      }

      const db = wx.cloud.database()
      
      if (this.data.isEdit) {
        // 更新现有书籍
        await db.collection('books')
          .doc(this.data.id)
          .update({
            data: bookData
          })
      } else {
        // 添加新书籍
        await db.collection('books')
          .add({
            data: {
              ...bookData,
              createTime: new Date()
            }
          })
      }

      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })

      // 返回上一页
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)

    } catch (error) {
      console.error('保存失败：', error)
      wx.showToast({
        title: error.message || '保存失败',
        icon: 'error'
      })
    } finally {
      wx.hideLoading()
    }
  }
})