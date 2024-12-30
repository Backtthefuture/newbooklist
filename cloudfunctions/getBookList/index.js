// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { celebrityId } = event
  
  try {
    // 获取名人信息
    const celebrityRes = await db.collection('celebrities')
      .doc(celebrityId)
      .get()

    // 获取书籍列表
    const booksRes = await db.collection('books')
      .where({
        celebrityId: celebrityId
      })
      .orderBy('order', 'asc')
      .get()

    return {
      success: true,
      data: {
        celebrity: celebrityRes.data,
        books: booksRes.data
      }
    }
  } catch (error) {
    return {
      success: false,
      message: error.message
    }
  }
}
