const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID, SOURCE } = cloud.getWXContext()
  
  // 检查是否为管理员
  if (SOURCE !== 'wx_devtools' && SOURCE !== 'wx_app_creator') {
    return {
      success: false,
      error: '无权限进行此操作'
    }
  }

  try {
    const { id, data } = event
    
    // 数据验证
    if (!id || !data) {
      return {
        success: false,
        error: '参数不完整'
      }
    }

    if (!data.name || !data.introduction || !data.avatar) {
      return {
        success: false,
        error: '名人信息不完整'
      }
    }

    // 更新数据
    const result = await db.collection('celebrities').doc(id).update({
      data: {
        name: data.name,
        introduction: data.introduction,
        avatar: data.avatar,
        updateTime: db.serverDate()
      }
    })

    return {
      success: true,
      updated: result.stats.updated,
      message: '更新成功'
    }

  } catch (error) {
    console.error('更新失败：', error)
    return {
      success: false,
      error: error.message || '更新失败'
    }
  }
}
