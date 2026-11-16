import {
  mkdir,
  readFile,
  writeFile,
  rename,
  readdir,
  unlink,
} from "node:fs/promises";
import { resolve, join } from "node:path";
import {
  createHash,
  createHmac,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { validateSession, assess } from "../src/engine.js";
import { activeQuestions, OPTIONS, VERSION } from "../src/data.js";
import { prepareAnalysis, knowledge } from "./analysis.mjs";
import { validateAIReport, AnalysisError } from "../src/ai-contract.js";
import {
  COLLECTION_VERSION,
  normalizeCollection,
} from "../src/collection-contract.js";
import { makeAnalysisRequest } from "../src/ai-input.js";
export { COLLECTION_VERSION };
const idPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const digest = (s) => createHash("sha256").update(s).digest("hex");
const reject = (message, status = 422) => {
  throw new AnalysisError("SUBMISSION_INVALID", message, status);
};
export function validateCollection(value) {
  try {
    return normalizeCollection(value);
  } catch {
    reject("提交授权或保存凭据不完整。");
  }
}
function signature(result, key) {
  return createHmac("sha256", key)
    .update("inner-atlas:archive-report:v1\n")
    .update(JSON.stringify(result))
    .digest();
}
export function authenticateArchiveReport(result, key) {
  return { ...result, archiveProof: signature(result, key).toString("hex") };
}
function verifyArchiveReport(result, key) {
  const { archiveProof, ...signed } = result || {};
  if (
    !key ||
    typeof archiveProof !== "string" ||
    !/^[0-9a-f]{64}$/.test(archiveProof) ||
    !timingSafeEqual(signature(signed, key), Buffer.from(archiveProof, "hex"))
  )
    reject("仅能归档由本站生成的原始 AI 报告，请在本站重新综合。");
  return signed;
}
export function createSubmissionStore(directory, { reportKey } = {}) {
  const root = resolve(directory),
    locks = new Map();
  const filename = (id) => {
    if (typeof id !== "string" || !idPattern.test(id))
      reject("记录编号不正确。");
    return join(root, id + ".json");
  };
  const readPrivate = async (id) => {
    try {
      return JSON.parse(await readFile(filename(id), "utf8"));
    } catch (e) {
      if (e.code === "ENOENT") return null;
      throw e;
    }
  };
  const publicRecord = (record) => {
    const { editTokenHash, ...data } = record;
    return data;
  };
  const locked = (id, fn) => {
    const prior = locks.get(id) || Promise.resolve();
    const next = prior.catch(() => {}).then(fn);
    locks.set(id, next);
    return next.finally(() => {
      if (locks.get(id) === next) locks.delete(id);
    });
  };
  return {
    async save(input) {
      const c = validateCollection(input?.collection);
      let session;
      try {
        session = validateSession(input.session);
      } catch {
        reject("答卷格式不正确，未保存。");
      }
      const active = activeQuestions(session.config);
      const answers = Object.fromEntries(
        active
          .filter((q) => Object.hasOwn(session.answers, q.id))
          .map((q) => [q.id, session.answers[q.id]]),
      );
      const answered = Object.values(answers).filter(Number.isInteger).length;
      const semantic = {
        config: Object.fromEntries(
          Object.entries(session.config)
            .filter(([key]) => key !== "remember")
            .sort(),
        ),
        answers: Object.fromEntries(Object.entries(answers).sort()),
      };
      const answerHash = digest(JSON.stringify(semantic));
      let ai = null;
      if (input.analysis) {
        const result = verifyArchiveReport(input.analysis.result, reportKey);
        const prepared = prepareAnalysis(input.analysis.assessment);
        if (result.inputHash !== prepared.inputHash)
          reject("AI报告与生成资料不匹配。");
        const archiveAssessment = prepareAnalysis(
          makeAnalysisRequest(
            session,
            input.analysis.assessment.context || {},
            input.analysis.assessment.consent.health,
          ),
        );
        if (archiveAssessment.inputHash !== prepared.inputHash)
          reject("答卷已变更，不能提交旧AI报告。");
        const report = validateAIReport(result.report, {
          evidence: prepared.evidence,
          knowledge: knowledge.entries,
          disabledSections: prepared.disabledSections,
          allowHealth: prepared.allowHealth,
        });
        ai = {
          report,
          provider: "DeepSeek",
          evidence: prepared.evidence,
          knowledge: knowledge.entries.map(({ id, title, sourceIds }) => ({
            id,
            title,
            sourceIds,
          })),
          review: result.review,
          inference: result.inference,
          context: prepared.packet.context,
          healthSharedToAI: prepared.allowHealth,
          model: result.model,
          generatedAt: result.generatedAt,
          promptVersion: result.promptVersion,
          knowledgeVersion: result.knowledgeVersion,
          inputHash: prepared.inputHash,
        };
      }
      return locked(c.id, async () => {
        await mkdir(root, { recursive: true, mode: 0o700 });
        try {
          await readFile(join(root, c.id + ".revoked.json"));
          reject("该共享记录已撤回，请重新同意后建立新记录。", 410);
        } catch (e) {
          if (e.code !== "ENOENT") throw e;
        }
        const old = await readPrivate(c.id);
        if (old && old.editTokenHash !== digest(c.editToken))
          reject("该记录的更新凭据不正确。", 403);
        if (!old && !answered) reject("至少作答一题后再保存。");
        if (old && old.revision >= c.revision)
          return {
            id: old.id,
            revision: old.revision,
            savedAt: old.updatedAt,
            status: old.status,
          };
        const now = new Date().toISOString();
        if (!ai && old?.answerHash === answerHash) ai = old.analysis;
        const record = {
          schemaVersion: "1.0",
          id: c.id,
          label: c.label || "匿名参与者",
          createdAt: old?.createdAt || now,
          updatedAt: now,
          revision: c.revision,
          consent: {
            version: c.version,
            granted: true,
            scope: "selected_answers_background_and_report",
          },
          questionVersion: VERSION,
          config: session.config,
          answers,
          itemResponses: active.map((q) => ({
            id: q.id,
            module: q.module,
            dimension: q.dimension,
            text: q.text,
            answer: answers[q.id] ?? null,
            answerLabel: Number.isInteger(answers[q.id])
              ? (q.options || OPTIONS[q.type])[answers[q.id] - q.min]
              : "未回答",
            reverse: q.reverse === true,
            source: q.source,
          })),
          answered,
          total: active.length,
          finished: session.finished,
          status: ai ? "reported" : session.finished ? "completed" : "draft",
          scores: assess(answers, session.config),
          analysis: ai,
          answerHash,
          editTokenHash: digest(c.editToken),
        };
        const temp = join(root, c.id + "." + randomUUID() + ".tmp");
        await writeFile(temp, JSON.stringify(record, null, 2), { mode: 0o600 });
        await rename(temp, filename(c.id));
        return {
          id: c.id,
          revision: c.revision,
          savedAt: now,
          status: record.status,
        };
      });
    },
    async list() {
      await mkdir(root, { recursive: true, mode: 0o700 });
      const files = (await readdir(root)).filter(
        (f) => idPattern.test(f.slice(0, -5)) && f.endsWith(".json"),
      );
      const records = await Promise.all(
        files.map((f) => readPrivate(f.slice(0, -5))),
      );
      return records
        .filter(Boolean)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map((r) => ({
          id: r.id,
          label: r.label,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          status: r.status,
          answered: r.answered,
          total: r.total,
          hasReport: !!r.analysis,
        }));
    },
    async get(id) {
      const r = await readPrivate(id);
      if (!r) reject("记录不存在。", 404);
      return publicRecord(r);
    },
    async all() {
      const records = await this.list();
      return Promise.all(records.map((r) => this.get(r.id)));
    },
    async remove(id, editToken) {
      return locked(id, async () => {
        filename(id);
        const old = await readPrivate(id);
        if (old && editToken && old.editTokenHash !== digest(editToken))
          reject("撤回凭据不正确。", 403);
        await mkdir(root, { recursive: true, mode: 0o700 });
        await writeFile(
          join(root, id + ".revoked.json"),
          JSON.stringify({ revokedAt: new Date().toISOString() }),
          { mode: 0o600 },
        );
        if (old) await unlink(filename(id));
      });
    },
  };
}
export function csv(rows) {
  const cell = (v) => {
    let s = String(v ?? "");
    if (/^[=+@\-\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  return "\ufeff" + rows.map((row) => row.map(cell).join(",")).join("\r\n");
}
export function answerCSV(record) {
  return csv([
    ["题目编号", "模块", "题目", "原始答案", "选项", "反向题"],
    ...record.itemResponses.map((q) => [
      q.id,
      q.module,
      q.text,
      q.answer ?? "",
      q.answerLabel,
      q.reverse ? "是" : "否",
    ]),
  ]);
}
