# 红果短剧 · Quantumult X 去广告

基于需求文档实现。**重写 + 分流请同时开启**，仅开重写时滑滑流广告仍会较多。

## 快速开始（两条都要加）

**1. 重写**

```text
https://raw.githubusercontent.com/zhouyinyuangit/Quantumult-X/main/HongGuo/rewrite/HongGuo_Ads.conf, tag=红果短剧-去广告, update-interval=86400, opt-parser=true, enabled=true
```

**2. 分流（策略 = reject）**

```text
https://raw.githubusercontent.com/zhouyinyuangit/Quantumult-X/main/HongGuo/filter/HongGuo_Ads.list, tag=红果短剧-广告域名, force-policy=reject, update-interval=86400, enabled=true
```

然后：证书信任 + MitM 开 → 更新订阅 → 划掉红果重开。详情见 [部署教程](doc/部署教程与故障排查.md)。

## 实现要点

| 场景 | 手段 |
|------|------|
| `is/i.snssdk.com`、穿山甲域名 | 分流直接 reject |
| 穿山甲 get_ads | 空广告包脚本 |
| 广告素材 CDN | URL reject |
| `*.fqnovel.com` | **不碰**（避免网络错误） |

## 仍会看到广告时

滑滑流里部分广告与正片走同一业务通道，圈X 无法在不误伤播放的前提下删掉。可配合：

1. 红果内关闭「程序化 / 个性化广告」  
2. 系统关掉加速度传感器（防摇一摇）  
3. 无障碍类自动「上滑继续观看」规则（如 GKD）  

若更新后再次「网络错误」，关掉分流并确认 MitM 无 `*.fqnovel.com`。
