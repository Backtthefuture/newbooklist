// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 测试数据
const celebritiesData = [
  {
    name: '李开复',
    avatar: 'cloud://booklist-7go3r6z767e1cf6e.626f-booklist-7go3r6z767e1cf6e-1314485267/avatars/kaifu.jpg',
    introduction: 'AI创新工场创始人，前谷歌全球副总裁，著名科技投资人'
  },
  {
    name: '吴军',
    avatar: 'cloud://booklist-7go3r6z767e1cf6e.626f-booklist-7go3r6z767e1cf6e-1314485267/avatars/wujun.jpg',
    introduction: '谷歌前高级研究员，数学博士，《浪潮之巅》作者'
  },
  {
    name: '罗振宇',
    avatar: 'cloud://booklist-7go3r6z767e1cf6e.626f-booklist-7go3r6z767e1cf6e-1314485267/avatars/luozhenyu.jpg',
    introduction: '得到App创始人，罗辑思维创始人'
  }
]

const booksData = [
  {
    celebrityName: '李开复',
    books: [
      {
        title: '人工智能',
        cover: 'cloud://booklist-7go3r6z767e1cf6e.626f-booklist-7go3r6z767e1cf6e-1314485267/books/ai.jpg',
        author: '李开复',
        publisher: '文化发展出版社',
        doubanScore: 8.8,
        recommendation: '这是一本探讨AI未来发展的重要著作，它不仅讨论了技术本身，更关注AI对人类社会的深远影响。'
      },
      {
        title: '世界因你不同',
        cover: 'cloud://booklist-7go3r6z767e1cf6e.626f-booklist-7go3r6z767e1cf6e-1314485267/books/different.jpg',
        author: '李开复',
        publisher: '商务印书馆',
        doubanScore: 8.6,
        recommendation: '这本书记录了我在Google和微软的经历，以及对年轻人的一些建议。'
      }
    ]
  },
  {
    celebrityName: '吴军',
    books: [
      {
        title: '浪潮之巅',
        cover: 'cloud://booklist-7go3r6z767e1cf6e.626f-booklist-7go3r6z767e1cf6e-1314485267/books/waves.jpg',
        author: '吴军',
        publisher: '人民邮电出版社',
        doubanScore: 9.1,
        recommendation: '这本书讲述了IT产业发展的历史，帮助读者了解产业发展规律。'
      },
      {
        title: '数学之美',
        cover: 'cloud://booklist-7go3r6z767e1cf6e.626f-booklist-7go3r6z767e1cf6e-1314485267/books/math.jpg',
        author: '吴军',
        publisher: '人民邮电出版社',
        doubanScore: 9.3,
        recommendation: '通过这本书，你会发现数学在计算机科学中的优雅应用。'
      }
    ]
  },
  {
    celebrityName: '罗振宇',
    books: [
      {
        title: '时间的朋友',
        cover: 'cloud://booklist-7go3r6z767e1cf6e.626f-booklist-7go3r6z767e1cf6e-1314485267/books/time.jpg',
        author: '罗振宇',
        publisher: '中信出版社',
        doubanScore: 8.5,
        recommendation: '这是我对时间管理和个人成长的思考，希望能帮助更多人。'
      }
    ]
  }
]

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 清空原有数据
    await db.collection('celebrities').where({}).remove()
    await db.collection('books').where({}).remove()

    // 插入名人数据
    const celebrityPromises = celebritiesData.map(celebrity => {
      return db.collection('celebrities').add({
        data: celebrity
      })
    })
    const celebrityResults = await Promise.all(celebrityPromises)

    // 构建名人ID映射
    const celebrityIdMap = {}
    celebrityResults.forEach((result, index) => {
      celebrityIdMap[celebritiesData[index].name] = result._id
    })

    // 插入书籍数据
    const bookPromises = []
    booksData.forEach(celebrityBooks => {
      const celebrityId = celebrityIdMap[celebrityBooks.celebrityName]
      celebrityBooks.books.forEach(book => {
        bookPromises.push(
          db.collection('books').add({
            data: {
              ...book,
              celebrityId
            }
          })
        )
      })
    })
    await Promise.all(bookPromises)

    return {
      success: true,
      message: '测试数据初始化成功'
    }
  } catch (error) {
    console.error(error)
    return {
      success: false,
      error: error
    }
  }
}
