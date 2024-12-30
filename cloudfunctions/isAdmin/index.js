const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  const { OPENID, SOURCE } = cloud.getWXContext()
  
  // 判断是否为管理员（小程序创建者）
  return {
    isAdmin: SOURCE === 'wx_devtools' || SOURCE === 'wx_app_creator'
  }
}
