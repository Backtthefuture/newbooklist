// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  
  try {
    const { id, data } = event
    
    // 数据验证
    if (!id || !data) {
      return {
        success: false,
        error: '参数不完整'
      }
    }

    if (!data.title || !data.author || !data.cover) {
      return {
        success: false,
        error: '书籍信息不完整'
      }
    }

    // 验证评分格式
    if (data.score !== null && (isNaN(data.score) || data.score < 0 || data.score > 10)) {
      return {
        success: false,
        error: '评分必须在0-10之间'
      }
    }

    // 更新数据
    const result = await db.collection('books').doc(id).update({
      data: {
        title: data.title,
        author: data.author,
        score: data.score,
        recommendation: data.recommendation || '',
        cover: data.cover,
        updateTime: db.serverDate()
      }
    })

    return {
      success: true,
      updated: result.stats.updated
    }

  } catch (error) {
    console.error('更新失败：', error)
    return {
      success: false,
      error: error.message || '更新失败'
    }
  }
}