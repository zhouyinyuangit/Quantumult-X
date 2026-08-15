# 红果短剧 · Quantumult X 去广告

基于 `doc/红果短剧 Quantumult X 去广告脚本开发需求文档.md` 实现的圈X 重写 + 脚本方案。  
目标：拦截开屏、贴片素材、穿山甲下发、弹窗/信息流广告字段，并尽量弱化激励解锁对广告的依赖，同时避开播放核心域名。

## 目录结构

```text
HongGuo/
├── doc/
│   ├── 红果短剧 Quantumult X 去广告脚本开发需求文档.md
│   └── 部署教程与故障排查.md
├── scripts/
│   └── HongGuo_Ads.js          # 响应体净化脚本
├── rewrite/
│   ├── HongGuo_Ads.conf        # 重写规则 + hostname
│   └── 订阅示例.txt
├── filter/
│   └── HongGuo_Ads.list        # 可选广告域名分流
└── README.md
```

## 快速开始

远程重写订阅（推送后可用）：

```text
https://raw.githubusercontent.com/zhouyinyuangit/Quantumult-X/main/HongGuo/rewrite/HongGuo_Ads.conf, tag=红果短剧-去广告, update-interval=86400, opt-parser=true, enabled=true
```

1. 按 [部署教程与故障排查](doc/部署教程与故障排查.md) 完成 **证书信任 + MitM**  
2. 导入上方重写订阅（或本地导入 `rewrite/HongGuo_Ads.conf`）  
3. 可选导入分流：`filter/HongGuo_Ads.list`  
4. 杀进程 / 清缓存后重开红果短剧验收  

远程订阅参数（需求文档 5.3）：

```text
tag=红果短剧-去广告
update-interval=86400
opt-parser=true
enabled=true
```

## 实现要点

| 场景 | 手段 |
|------|------|
| 穿山甲 get_ads / ad API | `reject-dict`（不改业务包） |
| 广告素材 / ad-pattern | `reject` |
| 业务域 `*.fqnovel.com` | **不 MitM、不改包**（避免刷视频网络错误） |

**刻意不拦截**：`*.fqnovel.com`、`*.fqnovelvod.com` 等业务与播放域名。

> 若仍出现「网络错误，请点击重试」，请更新本订阅，并确认 MitM 主机名中未手动添加 `*.fqnovel.com`。

## 限制说明

- 红果属字节系，部分版本存在证书锁定或服务端校验激励凭证，网络层无法 100% 覆盖所有场景  
- App 升级后若广告复现，用圈X 抓包补 URL / 字段即可迭代（脚本内已预留 `AD_KEYS`）  
- 详细排障见部署文档第八章  

## 许可与声明

仅供学习与自用网络净化配置参考。请遵守当地法律法规与 App 服务条款。
