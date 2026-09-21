export const TOOLS = [
  {
    id: "text-stats",
    index: "01",
    name: "文本统计",
    category: "文本",
    group: "常用工具",
    description: "统计字符、中文、单词、段落和阅读时间。",
    load: () => import("./text-stats.js"),
  },
  {
    id: "json-formatter",
    index: "02",
    name: "JSON 格式化",
    category: "开发",
    group: "常用工具",
    description: "格式化、压缩并检查 JSON 数据。",
    load: () => import("./json-formatter.js"),
  },
  {
    id: "timestamp",
    index: "03",
    name: "时间戳转换",
    category: "时间",
    group: "常用工具",
    description: "在时间戳与日期时间之间双向转换。",
    load: () => import("./timestamp.js"),
  },
  {
    id: "password",
    index: "04",
    name: "密码生成器",
    category: "安全",
    group: "常用工具",
    description: "按长度和字符类型生成随机密码。",
    load: () => import("./password.js"),
  },
  {
    id: "pdf-to-excel",
    index: "05",
    name: "PDF 表格转 Excel",
    category: "Excel 处理",
    group: "Excel 处理",
    description: "提取文字型 PDF 中的表格并导出 Excel。",
    load: () => import("./pdf-to-excel.js"),
  },
  {
    id: "image-to-excel",
    index: "06",
    name: "图片表格转 Excel",
    category: "Excel 处理",
    group: "Excel 处理",
    description: "本地识别表格图片并生成可编辑 Excel。",
    load: () => import("./image-to-excel.js"),
  },
  {
    id: "word-to-excel",
    index: "07",
    name: "Word 表格转 Excel",
    category: "Excel 处理",
    group: "Excel 处理",
    description: "读取 DOCX 文档中的表格并导出 Excel。",
    load: () => import("./word-to-excel.js"),
  },
];

export function resolveToolId(hash, tools = TOOLS) {
  const candidate = String(hash ?? "").replace(/^#/, "");
  return tools.some(({ id }) => id === candidate) ? candidate : "text-stats";
}
