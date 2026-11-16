# 朋友答卷与报告归档

朋友打开同一个 Node 网站，在开始前可以勾选「保存给创建者查看」。也可以在答题后从报告底部补充同意。称呼可以留空；未同意时，普通作答不会上传给创建者。共享后，答题进度和经本站生成的综合报告会自动保存。离开前可确认状态显示「答卷与报告已保存」。

## 你从哪里查看

打开同一站点的 `/#/owner`，输入创建者密钥。可以按称呼查找并区分「答题中」「已完成答卷」「已有 AI 报告」，打开逐题回答或综合报告。

- 全部记录：JSON。
- 单份：完整 JSON、逐题 CSV、AI 报告 Markdown。
- JSON 包含题目版本、作答范围、原始答案、逐题选项、服务端计分，以及可用的报告、参考资料和生成时用到的背景。不包含访问密钥、撤回凭据或模型内部推理。

朋友明确开启并作答的健康题也在答卷归档范围；发送健康题给 DeepSeek 用于报告仍需单独选择。续聊不会进入归档。参与者可在报告或隐私页「停止共享并撤回记录」。如想刷新后继续管理，应开启本机保存。清除本机或导入答题备份不会撤回已经提交的记录。已下载的副本由下载者另外删除。

## 部署到已有 Node 服务

1. 部署新版 `inner-atlas/` 并保留服务端现有的 DeepSeek、分析口令和允许来源设置。
2. 在后端环境配置 `COLLECT_SUBMISSIONS=true`、一个独立的 `OWNER_ACCESS_TOKEN`（至少 32 字符），以及 `SUBMISSIONS_DIR`（Node 进程有写权限的私有持久目录）。可用 `openssl rand -hex 32` 在管理终端生成查看密钥；只在服务端和自己的后台登录界面使用。
3. 如果通过 HTTPS 代理提供访问，将对外站点的完整 origin 加入 `ALLOWED_ORIGINS`，不包含路径。重启后检查 `/api/status` 的 `configured` 和 `/api/submissions/status` 的 `enabled`。朋友使用 Node 站点地址，你从同一地址的 `/#/owner` 登录。GitHub Pages 可呈现新版报告界面，但不会运行存储服务。

若使用容器，将私有持久卷挂载到 `SUBMISSIONS_DIR`；临时容器目录不会随重建保留。目录需要与代码、静态资源和 Git 工作树分开。当前实现适合单进程、少量分享，采用逐记录 JSON 和原子替换；不要让多实例同时写入同一目录。即使是演示，也应定期导出所需记录或备份此目录。

## 报告阅读与表达

新版把读者最常用的五个入口放在固定目录：整体画像、关系方式、深层理解、行动建议、依据与边界。生成后收起表单；详细证据、反例、理论与追问仍可展开。提示词要求从一条跨领域主线说清一个人的相处方式，分别解释恋人、朋友和家庭中的差异，并把行动写到可以试一次、观察结果的程度。

参考 [Truity 的大五样例](https://www.truity.com/sites/default/files/fillpdf/sample_big_five_personality_test_report.pdf)如何组织生活领域、[VIA Total 24 预览](https://www.viacharacter.org/resources/activities/look-inside-sample-total-24-report)如何讨论优势的使用程度，以及[大五 30 分面样例](https://bigfivepersonalitytest.org/sample-facet-report.php)怎样分开整体和细节。只参考写法与结构，没有导入这些产品的题库、常模或类型模型。
