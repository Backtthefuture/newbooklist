const XLSX = require('xlsx');

// 创建工作簿
const wb = XLSX.utils.book_new();

// 准备数据
const data = [
    ['书名', '作者', '封面图片URL', '豆瓣评分', '推荐语'],
    ['深度工作', '卡尔·纽波特', 'https://example.com/cover.jpg', '9.1', '这是一本关于如何在分心的世界中专注工作的书']
];

// 创建工作表
const ws = XLSX.utils.aoa_to_sheet(data);

// 设置列宽
ws['!cols'] = [
    { wch: 20 }, // 书名
    { wch: 20 }, // 作者
    { wch: 40 }, // 封面图片URL
    { wch: 10 }, // 豆瓣评分
    { wch: 50 }  // 推荐语
];

// 将工作表添加到工作簿
XLSX.utils.book_append_sheet(wb, ws, "批量上传模板");

// 生成Excel文件
XLSX.writeFile(wb, "batch_upload_template.xlsx");
