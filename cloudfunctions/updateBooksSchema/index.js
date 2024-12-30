// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database()
  
  try {
    // 获取所有书籍记录
    const { data: books } = await db.collection('books').get()
    
    // 为每本书添加统计字段
    const updatePromises = books.map(book => {
      return db.collection('books').doc(book._id).update({
        data: {
          clickCount: 0,    // 初始化点击数
          confirmCount: 0   // 初始化确认数
        }
      })
    })
    
    // 等待所有更新完成
    await Promise.all(updatePromises)
    
    return {
      success: true,
      message: '数据库更新成功'
    }
  } catch (error) {
    console.error('更新数据库失败：', error)
    return {
      success: false,
      error
    }
  }
}
