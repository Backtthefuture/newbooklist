Page({
  data: {
    id: '', // 编辑模式下的名人ID
    avatar: '', // 已上传的头像云文件ID
    tempAvatar: '', // 临时头像本地路径
    name: '',
    introduction: '',
    canSave: false, // 是否可以保存
    isEdit: false // 是否是编辑模式
  },

  onLoad(options) {
    // 如果传入了ID，说明是编辑模式
    if (options.id) {
      this.setData({ 
        id: options.id,
        isEdit: true
      })
      this.loadCelebrityData(options.id)
    }
    
    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: this.data.isEdit ? '编辑名人' : '添加名人'
    })
  },

  // 加载名人数据（编辑模式）
  async loadCelebrityData(id) {
    wx.showLoading({ title: '加载中...' })
    
    try {
      const db = wx.cloud.database()
      const { data } = await db.collection('celebrities').doc(id).get()
      
      this.setData({
        avatar: data.avatar,
        name: data.name,
        introduction: data.introduction
      })
      this.checkCanSave()
    } catch (error) {
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
      console.error('加载名人数据失败：', error)
    } finally {
      wx.hideLoading()
    }
  },

  // 选择头像
  async onChooseAvatar() {
    try {
      const { tempFilePaths } = await wx.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      })
      
      this.setData({
        tempAvatar: tempFilePaths[0]
      })
      
      this.checkCanSave()
    } catch (error) {
      console.error('选择图片失败：', error)
    }
  },

  // 输入姓名
  onNameInput(e) {
    this.setData({
      name: e.detail.value
    })
    this.checkCanSave()
  },

  // 输入简介
  onIntroInput(e) {
    this.setData({
      introduction: e.detail.value
    })
    this.checkCanSave()
  },

  // 检查是否可以保存
  checkCanSave() {
    const { name, introduction, avatar, tempAvatar } = this.data
    const canSave = name.trim() && introduction.trim() && (avatar || tempAvatar)
    this.setData({ canSave })
  },

  // 上传头像到云存储
  async uploadAvatar() {
    if (!this.data.tempAvatar) {
      return this.data.avatar // 如果没有新头像，返回原来的
    }

    const cloudPath = `avatars/${Date.now()}-${Math.random().toString(36).slice(-6)}.jpg`
    
    try {
      const { fileID } = await wx.cloud.uploadFile({
        cloudPath,
        filePath: this.data.tempAvatar
      })
      return fileID
    } catch (error) {
      throw new Error('上传头像失败：' + error.message)
    }
  },

  // 保存数据
  async onSave() {
    if (!this.data.canSave) return
    
    wx.showLoading({ title: '保存中...' })
    
    try {
      // 1. 上传头像（如果有新头像）
      const avatarFileID = await this.uploadAvatar()
      
      // 2. 准备数据
      const updateData = {
        name: this.data.name.trim(),
        introduction: this.data.introduction.trim(),
        avatar: avatarFileID
      }
      
      // 3. 保存到数据库
      if (this.data.isEdit) {
        // 编辑模式：调用云函数
        console.log('准备更新数据：', {id: this.data.id, data: updateData})
        const { result } = await wx.cloud.callFunction({
          name: 'updateCelebrity',
          data: {
            id: this.data.id,
            data: updateData
          }
        })
        
        console.log('更新结果：', result)
        if (!result.success) {
          throw new Error(result.error || '更新失败')
        }
      } else {
        // 新增模式
        const db = wx.cloud.database()
        await db.collection('celebrities').add({
          data: updateData
        })
      }
      
      // 4. 显示成功提示
      wx.showToast({
        title: '保存成功',
        icon: 'success',
        duration: 1500,
        success: () => {
          // 确保 toast 显示完成后再返回
          setTimeout(() => {
            // 返回上一页
            wx.navigateBack({
              success: () => {
                // 确保返回完成后再刷新数据
                const pages = getCurrentPages()
                const prevPage = pages[pages.length - 1]
                if (prevPage && prevPage.loadData) {
                  prevPage.loadData()
                }
              }
            })
          }, 1500)
        }
      })
      
    } catch (error) {
      console.error('保存失败详细信息：', error)
      wx.showToast({
        title: error.message || '保存失败',
        icon: 'error'
      })
    } finally {
      wx.hideLoading()
    }
  }
})
