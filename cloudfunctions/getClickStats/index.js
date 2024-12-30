// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database()
  const $ = db.command.aggregate

  try {
    // 使用聚合查询获取统计数据
    const { list } = await db.collection('books')
      .aggregate()
      .group({
        _id: null,
        totalClicks: { $sum: '$clickCount' },
        totalConfirms: { $sum: '$confirmCount' },
        bookStats: {
          $push: {
            title: '$title',
            clicks: '$clickCount',
            confirms: '$confirmCount'
          }
        }
      })
      .end()

    // 如果没有数据，返回默认值
    if (!list || list.length === 0) {
      return {
        success: true,
        data: {
          totalClicks: 0,
          totalConfirms: 0,
          conversionRate: 0,
          bookStats: []
        }
      }
    }

    // 计算转化率
    const stats = list[0]
    stats.conversionRate = stats.totalClicks > 0 
      ? Math.round((stats.totalConfirms / stats.totalClicks) * 100) / 100 
      : 0

    // 计算每本书的转化率并排序
    stats.bookStats = stats.bookStats
      .map(book => ({
        ...book,
        rate: book.clicks > 0 ? Math.round((book.confirms / book.clicks) * 100) / 100 : 0
      }))
      .sort((a, b) => b.clicks - a.clicks) // 按点击数降序排序

    return {
      success: true,
      data: stats
    }
  } catch (error) {
    console.error('获取统计数据失败：', error)
    return {
      success: false,
      error
    }
  }
}
