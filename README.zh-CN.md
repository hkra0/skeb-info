# Skeb info
基于 Cloudflare Worker 的简易 Skeb 用户信息查询工具 (๑• . •๑)

[English](README.md) | 中文

## 功能特性

- 🔍 通过用户名或链接搜索 Skeb 画师资料
- 📑 显示详细信息，即使画师关闭请求仍可获取报价和截止时间
- 🔗 带速率限制的 Skeb 用户信息 API 代理
- ❤️ 简洁、用户友好的界面

## 使用方法

- 访问 [skebinfo.hkra.xyz](https://skebinfo.hkra.xyz/)，输入用户名或链接，点击查询
- 点击用户名称可以打开该用户的 Skeb 主页
- 点击已发送公开委托数量 (`Sent Public Requests`) 的数字可查看该客户按创作者排序的请求数量统计

## 免责声明

本工具为非官方接口，仅用于获取 Skeb 平台公开的创作者信息。使用者须遵守 Skeb 服务条款，禁止滥用服务、进行欺诈行为或侵犯第三方权益。开发者不对任何滥用行为或违反 Skeb 指南导致的后果承担责任。

## API 端点
- 用户信息: `/api/users/<username>`
- 所有作品（创作者）: `/api/users/<username>/works?role=creator`
- 所有发送的请求（客户）: `/api/users/<username>/works?role=client`
    - 数据量过大（超过1200）时需要分片，使用返回数据中 `meta.next` 作为下一部分请求的 URL

## 部署方式
### 连接 git
1. Clone 或者 fork 本仓库
2. 创建一个 Cloudflare Worker，选择"Import a repository"然后选择刚刚 Clone 或者 fork 好的仓库
3. 保留默认配置，选择保存并部署
### 手动部署
1. 创建一个 Cloudflare Worker，选择“Start with Hello World!”
2. 将 `worker.js` 的内容替换为本项目中的 [worker.js](worker.js)
3. 点击部署
### Wrangler 命令行
- 下载仓库文件，运行 `weangler deploy`

## 限制

- 速率限制：每个 IP 每分钟 6 次请求
- 无法完成数据量过大的请求（`Sent Public Requests` 超过 6000 时）
- 依赖 Skeb API：可能受到限制或出现字段更新等原因导致的不可用

## 协议
MIT
