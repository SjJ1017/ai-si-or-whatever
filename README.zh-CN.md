# AI, SI, or Whatever

[English](README.md)

按你的偏好替换网页术语：**AI**、**SI**、**定时交替**或**自定义名称**。支持全称和 OpenAI、AI-Agent 等合成词。默认离线，无需 API。

## 安装

1. 下载 [Release](https://github.com/SjJ1017/ai-si-or-whatever/releases) 中的安装 ZIP 并解压。
2. 打开 `chrome://extensions`，开启「开发者模式」。
3. 点击「加载已解压的扩展程序」，选择含 `manifest.json` 的目录。
4. 刷新已有网页，打开插件，选择偏好并点击 **Save**。

保留解压目录。更新时覆盖同一目录，在扩展管理页点击重新加载，再刷新网页。

## 使用

- **AI / SI**：缩写和全称双向替换。
- **Prefer not to say**：整页定时切换，可设置秒数。
- **Custom**：全部替换成你填写的名称。
- 关闭开关并保存可恢复原文；Settings 可保留大小写、排除网站。

## 可选 Jev

展开 **Jev**，填入自己的 TypeSafe API key，启用并保存。仅发送候选词附近的短片段，可能包含私人内容并产生费用。默认最多 24 处/次、6 次/页面框架；低置信度或错误时使用本地规则。密钥保存在本机，不随插件分发。

匹配会避开代码和输入框，但规则可能误判。浏览器内部页面、图片、PDF、Shadow DOM 和跨文本节点的词暂不支持。

[隐私说明](PRIVACY.md) · [MIT](LICENSE) · [JetBrains Mono 字体许可](fonts/OFL.txt)
