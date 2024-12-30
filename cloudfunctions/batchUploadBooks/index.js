// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  // 检查权限
  const { OPENID, SOURCE } = cloud.getWXContext()
  const isAdmin = SOURCE === 'wx_devtools' || SOURCE === 'wx_app_creator'
  if (!isAdmin) {
    return {
      success: false,
      message: '无权限操作'
    }
  }

  const { celebrityId, books } = event
  
  try {
    // 1. 验证数据格式
    if (!Array.isArray(books) || books.length === 0) {
      return {
        success: false,
        message: '书籍数据格式错误'
      }
    }

    // 2. 批量添加书籍
    const batchTasks = books.map(book => {
      return db.collection('books').add({
        data: {
          celebrityId,
          title: book.title,
          author: book.author,
          coverUrl: book.coverUrl,
          doubanScore: book.doubanScore || null,
          recommendation: book.recommendation || '',
          createTime: db.serverDate(),
          updateTime: db.serverDate(),
          order: 0 // 默认排序
        }
      })
    })

    await Promise.all(batchTasks)

    return {
      success: true,
      message: `成功导入 ${books.length} 本书籍`
    }

  } catch (error) {
    console.error('批量导入失败：', error)
    return {
      success: false,
      message: error.message || '导入失败'
    }
  }
}
