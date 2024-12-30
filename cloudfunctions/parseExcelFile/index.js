// 云函数入口文件
const cloud = require('wx-server-sdk')
const XLSX = require('xlsx')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

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

  const { fileID } = event
  
  try {
    // 1. 下载文件
    const res = await cloud.downloadFile({
      fileID: fileID,
    })
    const buffer = res.fileContent

    // 2. 解析Excel文件
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

    // 3. 验证表头
    const headers = data[0]
    const requiredHeaders = ['书名', '作者', '封面图片URL']
    const optionalHeaders = ['豆瓣评分', '推荐语']
    
    // 检查必填字段是否存在
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
    if (missingHeaders.length > 0) {
      throw new Error(`缺少必填字段：${missingHeaders.join(', ')}`)
    }

    // 4. 获取字段索引
    const titleIndex = headers.indexOf('书名')
    const authorIndex = headers.indexOf('作者')
    const coverUrlIndex = headers.indexOf('封面图片URL')
    const scoreIndex = headers.indexOf('豆瓣评分')
    const recommendationIndex = headers.indexOf('推荐语')

    // 5. 解析数据行
    const books = []
    const invalidRows = []
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i]
      // 跳过空行
      if (!row || row.length === 0) continue
      
      // 检查必填字段
      const missingFields = []
      if (!row[titleIndex]) missingFields.push('书名')
      if (!row[authorIndex]) missingFields.push('作者')
      if (!row[coverUrlIndex]) missingFields.push('封面图片URL')
      
      if (missingFields.length > 0) {
        invalidRows.push({
          row: i + 1,
          missingFields: missingFields
        })
        continue
      }

      books.push({
        title: row[titleIndex],
        author: row[authorIndex],
        coverUrl: row[coverUrlIndex],
        doubanScore: scoreIndex >= 0 ? (row[scoreIndex] ? parseFloat(row[scoreIndex]) : null) : null,
        recommendation: recommendationIndex >= 0 ? (row[recommendationIndex] || '') : ''
      })
    }

    // 如果有无效行，报错
    if (invalidRows.length > 0) {
      const errorMessage = invalidRows.map(item => 
        `第${item.row}行缺少：${item.missingFields.join(', ')}`
      ).join('\n')
      throw new Error('数据格式错误：\n' + errorMessage)
    }

    // 6. 删除临时文件
    await cloud.deleteFile({
      fileList: [fileID]
    })

    // 7. 返回解析结果
    return {
      success: true,
      data: books,
      message: `成功解析 ${books.length} 条数据`
    }

  } catch (error) {
    console.error('解析Excel失败：', error)
    return {
      success: false,
      message: error.message || '解析失败'
    }
  }
}
