export const TOOLS = [
  {
    id: "text-stats",
    index: "01",
    name: "文本统计",
    category: "文本",
    description: "统计字符、中文、单词、段落和阅读时间。",
    load: () => import("./text-stats.js"),
  },
  {
    id: "json-formatter",
    index: "02",
    name: "JSON 格式化",
    category: "开发",
    description: "格式化、压缩并检查 JSON 数据。",
    load: () => import("./json-formatter.js"),
  },
  {
    id: "timestamp",
    index: "03",
    name: "时间戳转换",
    category: "时间",
    description: "在时间戳与日期时间之间双向转换。",
    load: () => import("./timestamp.js"),
  },
  {
    id: "password",
    index: "04",
    name: "密码生成器",
    category: "安全",
    description: "按长度和字符类型生成随机密码。",
    load: () => import("./password.js"),
  },
];

export function resolveToolId(hash, tools = TOOLS) {
  const candidate = String(hash ?? "").replace(/^#/, "");
  return tools.some(({ id }) => id === candidate) ? candidate : "text-stats";
}
