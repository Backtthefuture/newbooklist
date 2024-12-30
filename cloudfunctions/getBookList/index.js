// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { celebrityId } = event
  
  try {
    console.log('接收到的 celebrityId:', celebrityId) // 添加日志
    
    // 获取名人信息
    const celebrityRes = await db.collection('celebrities')
      .doc(celebrityId)
      .get()
      
    console.log('查询到的名人信息:', celebrityRes.data) // 添加日志

    // 获取书籍列表
    const booksRes = await db.collection('books')
      .where({
        celebrityId: celebrityId
      })
      .orderBy('order', 'asc')
      .get()
      
    console.log('查询到的书籍列表:', booksRes.data) // 添加日志

    // 确保返回正确的数据结构
    const responseData = {
      celebrity: celebrityRes.data,
      books: booksRes.data
    }
    
    console.log('返回的数据:', responseData) // 添加日志

    return {
      success: true,
      data: responseData
    }
  } catch (error) {
    console.error('云函数执行错误:', error) // 添加日志
    return {
      success: false,
      message: error.message || '获取数据失败'
    }
  }
}
