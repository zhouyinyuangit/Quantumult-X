/**
 * 红果短剧 - 穿山甲空广告包（轻量备用）
 * 仅处理 get_ads / stats / settings，不做业务 JSON 递归
 * 若主脚本 HongGuo_Ads.js 导致页面异常，可在 conf 中改挂本文件
 */

const EMPTY = {
  request_id: "",
  ret: 0,
  message: "success",
  ads: [],
  creatives: [],
  data: { ads: [], creatives: [] },
};

$done({ body: JSON.stringify(EMPTY) });
