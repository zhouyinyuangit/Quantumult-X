/**
 * 红果短剧 - 去广告（script-response-body）
 * 适用：Quantumult X
 * 作用：清空穿山甲广告下发、过滤业务接口中的广告/引流字段，保留播放与账号相关数据
 *
 * 匹配说明见 rewrite/HongGuo_Ads.conf
 * 迭代：抓包后在 AD_KEYS / FEED_AD_MARKERS 中补充字段即可
 */

const CONFIG = {
  // 调试：true 时在通知栏提示命中路径（正式使用请保持 false）
  debug: false,
  // 穿山甲 get_ads 空广告包
  emptyPangolin: {
    request_id: "",
    ret: 0,
    message: "success",
    ads: [],
    creatives: [],
  },
};

/** 常见广告 / 弹窗 / 引流字段名（递归删除） */
const AD_KEYS = new Set([
  "ad_info",
  "ad_data",
  "ad_list",
  "ad_items",
  "ads",
  "advert",
  "advertisement",
  "ad_config",
  "adConfig",
  "splash",
  "splash_ad",
  "splash_ads",
  "splash_info",
  "splashAd",
  "open_ad",
  "open_screen",
  "openScreenAd",
  "popup",
  "popups",
  "popup_list",
  "popup_ads",
  "float_ad",
  "float_ads",
  "floating_ad",
  "banner_ad",
  "banner_ads",
  "feed_ad",
  "feed_ads",
  "insert_ad",
  "insert_ads",
  "patch_ad",
  "mid_roll",
  "pre_roll",
  "post_roll",
  "reward_ad",
  "rewarded_ad",
  "incentive_ad",
  "commerce",
  "commerce_info",
  "promotion",
  "promotions",
  "promotion_list",
  "activity_banner",
  "activity_popup",
  "operation_ad",
  "operation_list",
  "guide_ad",
  "download_guide",
  "app_download",
  "cross_promo",
  "live_ad",
  "shop_window",
  "mall_entrance",
  "welfare_popup",
  "task_popup",
  "red_packet_ad",
]);

/** 信息流条目上用于判定广告卡片的标记 */
const FEED_AD_MARKERS = [
  "is_ad",
  "isAd",
  "is_advert",
  "ad_type",
  "adType",
  "ad_id",
  "adId",
  "advertiser_id",
  "is_promotion",
  "isPromotion",
  "card_type_ad",
  "style_type_ad",
];

const AD_TYPE_VALUES = new Set([
  "ad",
  "ads",
  "advert",
  "advertisement",
  "splash",
  "banner",
  "feed_ad",
  "insert",
  "reward",
  "rewarded",
  "commerce",
  "promotion",
  "live_ad",
  "download",
]);

function notify(title, body) {
  if (!CONFIG.debug) return;
  try {
    $notify(title, "", body);
  } catch (e) {
    // ignore
  }
}

function safeParse(raw) {
  if (raw == null || raw === "") return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function looksLikeAdItem(item) {
  if (!isPlainObject(item)) return false;
  for (const key of FEED_AD_MARKERS) {
    if (!(key in item)) continue;
    const val = item[key];
    if (val === true || val === 1 || val === "1") return true;
    if (typeof val === "string" && AD_TYPE_VALUES.has(val.toLowerCase())) return true;
    if (typeof val === "number" && val > 0 && /ad|advert/i.test(key)) return true;
  }
  // 部分接口用 type / card_type / item_type 标识
  for (const k of ["type", "card_type", "item_type", "content_type", "style"]) {
    const v = item[k];
    if (typeof v === "string" && AD_TYPE_VALUES.has(v.toLowerCase())) return true;
    if (typeof v === "number" && (v === 999 || v === 1000)) return true; // 预留常见广告 type
  }
  return false;
}

function stripAds(node, depth) {
  if (depth > 40) return node;
  if (Array.isArray(node)) {
    const out = [];
    for (const item of node) {
      if (looksLikeAdItem(item)) continue;
      out.push(stripAds(item, depth + 1));
    }
    return out;
  }
  if (!isPlainObject(node)) return node;

  const out = {};
  for (const key of Object.keys(node)) {
    if (AD_KEYS.has(key)) continue;
    // 模糊匹配 *_ad / *Ad / *ads 字段（避免误删 video_id 等）
    if (/(^|_)(ad|ads|advert|splash|popup|banner)(s|_info|_list|_data|_config)?$/i.test(key)) {
      continue;
    }
    out[key] = stripAds(node[key], depth + 1);
  }
  return out;
}

/** 激励解锁：在响应中标记已完成/可解锁，尽量不改动其它业务字段 */
function unlockRewardHints(node, depth) {
  if (depth > 30 || node == null) return node;
  if (Array.isArray(node)) {
    return node.map((x) => unlockRewardHints(x, depth + 1));
  }
  if (!isPlainObject(node)) return node;

  const out = { ...node };
  const unlockKeys = [
    "need_ad",
    "needAd",
    "need_watch_ad",
    "needWatchAd",
    "force_ad",
    "forceAd",
    "is_locked",
    "isLocked",
    "lock_by_ad",
    "ad_unlock",
  ];
  for (const k of unlockKeys) {
    if (k in out) {
      if (typeof out[k] === "boolean") out[k] = /need|force|lock/i.test(k) ? false : out[k];
      if (typeof out[k] === "number") out[k] = 0;
    }
  }
  // 常见完成态字段
  if ("reward_done" in out) out.reward_done = true;
  if ("is_rewarded" in out) out.is_rewarded = true;
  if ("ad_finished" in out) out.ad_finished = true;
  if ("can_play" in out && typeof out.can_play === "boolean") out.can_play = true;
  if ("unlock" in out && typeof out.unlock === "boolean") out.unlock = true;
  if ("unlocked" in out && typeof out.unlocked === "boolean") out.unlocked = true;

  for (const k of Object.keys(out)) {
    if (isPlainObject(out[k]) || Array.isArray(out[k])) {
      out[k] = unlockRewardHints(out[k], depth + 1);
    }
  }
  return out;
}

function handlePangolinEmpty() {
  return JSON.stringify(CONFIG.emptyPangolin);
}

function main() {
  const url = $request.url || "";
  const method = ($request.method || "GET").toUpperCase();
  let body = $response.body;

  // 穿山甲广告拉取：直接空包
  if (/\/api\/ad\/union\/sdk\/(get_ads|stats|settings)/i.test(url)) {
    notify("红果去广告", "穿山甲 get_ads → 空包");
    $done({ body: handlePangolinEmpty() });
    return;
  }

  // 其它 /api/ad/ 路径
  if (/\/api\/ad\//i.test(url) || /\/api\/adserver\//i.test(url)) {
    notify("红果去广告", "ad api → 空包");
    $done({ body: JSON.stringify({ code: 0, message: "ok", data: {}, ads: [] }) });
    return;
  }

  // 非 JSON 不处理（避免误伤图片/视频）
  const ct = (($response.headers || {})["Content-Type"] || ($response.headers || {})["content-type"] || "").toLowerCase();
  if (ct && !/json|text|javascript|octet-stream/i.test(ct) && !/^\s*[\[{]/.test(String(body || "").slice(0, 8))) {
    $done({});
    return;
  }

  const json = safeParse(body);
  if (!json) {
    $done({});
    return;
  }

  let result = stripAds(json, 0);

  // 剧集解锁 / 激励相关路径额外处理
  if (
    /reward|incentive|unlock|vip_ad|watch_ad|ad_unlock|commerce\/reward/i.test(url) ||
    /shortvideo|short_series|series\/play|episode/i.test(url)
  ) {
    result = unlockRewardHints(result, 0);
  }

  notify("红果去广告", `${method} ${url.split("?")[0].slice(-80)}`);
  $done({ body: JSON.stringify(result) });
}

try {
  main();
} catch (e) {
  // 异常时原样放行，避免影响播放
  $done({});
}
