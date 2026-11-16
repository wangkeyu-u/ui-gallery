import { loadEnvFile } from "node:process";
import { configurationReport } from "../api/config.mjs";
const machine = process.argv.includes("--json");
try {
  loadEnvFile(".env");
} catch (error) {
  if (error.code !== "ENOENT") {
    console.error(
      machine
        ? JSON.stringify({ ready: false, error: "配置文件格式无法读取。" })
        : "配置文件格式无法读取；未输出其中内容。",
    );
    process.exit(1);
  }
}
const report = configurationReport(process.env);
if (machine) console.log(JSON.stringify(report, null, 2));
else {
  console.log("见己 · 后端发布前检查（不调用 DeepSeek，不展示密钥）");
  for (const check of report.checks)
    console.log(`${check.ok ? "通过" : "待配置"} · ${check.message}`);
  for (const note of report.notes) console.log("说明 · " + note);
  console.log(
    report.ready
      ? "结果 · 配置格式就绪，部署后仍需真实调用验证。"
      : "结果 · 尚未就绪，请按 .env.example 在后端补齐配置。",
  );
}
process.exitCode = report.ready ? 0 : 1;
