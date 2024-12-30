// app.js
App({
  onLaunch: function () {
    console.log('App onLaunch')
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'booklist-7go3r6z767e1cf6e',  // 您的云开发环境ID
        traceUser: true,
      })
    }

    // 初始化权限检查
    this.checkAdminPermission()
  },

  // 权限检查函数
  async checkAdminPermission() {
    console.log('开始检查管理员权限')
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'isAdmin'
      })
      console.log('权限检查结果:', result)
      this.globalData.isAdmin = result.isAdmin
      this.globalData.adminChecked = true  // 标记权限检查已完成
      
      // 如果有等待的回调，执行它们
      if (this.adminReadyCallback) {
        console.log('执行权限检查回调')
        this.adminReadyCallback(result.isAdmin)
      } else {
        console.log('没有等待的权限检查回调')
      }
    } catch (error) {
      console.error('检查管理员权限失败：', error)
      this.globalData.isAdmin = false
      this.globalData.adminChecked = true  // 即使失败也标记为已检查
      if (this.adminReadyCallback) {
        this.adminReadyCallback(false)
      }
    }
  },

  globalData: {
    userInfo: null,
    isAdmin: false,
    adminChecked: false  // 添加标志位
  }
})
