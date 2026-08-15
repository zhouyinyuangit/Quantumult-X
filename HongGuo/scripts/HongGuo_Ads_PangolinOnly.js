/**
 * 红果短剧 - 穿山甲空广告包
 * 供 Quantumult X script-response-body 使用
 * 多结构兼容：不同 SDK 版本读取 ads / creatives / data 字段不一
 */

const EMPTY = {
  request_id: "",
  ret: 0,
  code: 0,
  message: "success",
  msg: "success",
  reason: 0,
  ads: [],
  creatives: [],
  adslots: [],
  data: {
    ads: [],
    creatives: [],
    adslots: [],
  },
};

$done({
  status: "HTTP/1.1 200 OK",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify(EMPTY),
});
