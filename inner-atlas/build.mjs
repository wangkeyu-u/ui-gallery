import { mkdir, cp, rm } from "node:fs/promises";
await rm("dist", { recursive: true, force: true });
await mkdir("dist");
for (const file of ["index.html", "favicon.svg", "src", "docs"])
  await cp(file, "dist/" + file, { recursive: true });
console.log("Static site ready: dist/");
