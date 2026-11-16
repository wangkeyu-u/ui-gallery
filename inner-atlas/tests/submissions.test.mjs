import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID, randomBytes } from "node:crypto";
import { once } from "node:events";
import {
  createSubmissionStore,
  authenticateArchiveReport,
  COLLECTION_VERSION,
  answerCSV,
  csv,
} from "../api/submissions.mjs";
import { createApp } from "../api/http.mjs";
import { fixtureSession, fixtureReport } from "./fixtures/ai.mjs";
import { prepareAnalysis } from "../api/analysis.mjs";
import { makeAnalysisRequest } from "../src/ai-input.js";
const collection = () => ({
  version: COLLECTION_VERSION,
  granted: true,
  label: "测试朋友",
  id: randomUUID(),
  editToken: randomBytes(32).toString("hex"),
  revision: 1,
});
const payload = () => ({
  collection: collection(),
  session: fixtureSession({ health: true, jung: false }),
});
const reportKey = randomBytes(32).toString("hex");
async function temp(fn) {
  const dir = await mkdtemp(join(tmpdir(), "inner-atlas-store-"));
  try {
    await fn(createSubmissionStore(dir, { reportKey }), dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
test("consented partial answers and actual zero values persist in structured records", async () =>
  temp(async (store, dir) => {
    const p = payload();
    p.session.answers = { "ipip-1": 4, "phq-1": 0 };
    p.session.finished = false;
    const saved = await store.save(p);
    assert.equal(saved.status, "draft");
    const record = await store.get(saved.id);
    assert.equal(record.answered, 2);
    assert.equal(record.answers["phq-1"], 0);
    assert.equal(record.scores.screens.phq.sum, null);
    const persisted = JSON.parse(
      await readFile(join(dir, saved.id + ".json"), "utf8"),
    );
    assert.equal(persisted.schemaVersion, "1.0");
    assert.ok(!JSON.stringify(persisted).includes(p.collection.editToken));
    assert.ok(!("editTokenHash" in record));
    p.collection.revision++;
    p.session.answers = { "ipip-1": null, "phq-1": null };
    await store.save(p);
    const cleared = await store.get(saved.id);
    assert.equal(cleared.answered, 0);
    assert.equal(cleared.answers["phq-1"], null);
  }));
test("saving requires explicit consent and never overwrites another participant receipt", async () =>
  temp(async (store) => {
    const p = payload();
    await assert.rejects(
      store.save({ ...p, collection: { ...p.collection, granted: false } }),
    );
    await store.save(p);
    await assert.rejects(
      store.save({
        ...p,
        collection: {
          ...p.collection,
          editToken: randomBytes(32).toString("hex"),
          revision: 2,
        },
      }),
      /凭据/,
    );
    assert.equal((await store.get(p.collection.id)).label, "测试朋友");
  }));
test("revision ordering and concurrent retries cannot roll a newer answer back", async () =>
  temp(async (store) => {
    const p = payload();
    await store.save(p);
    const newer = structuredClone(p);
    newer.collection.revision = 3;
    newer.session.answers["ipip-1"] = 5;
    const older = structuredClone(p);
    older.collection.revision = 2;
    older.session.answers["ipip-1"] = 1;
    await Promise.all([store.save(newer), store.save(older)]);
    const r = await store.get(p.collection.id);
    assert.equal(r.revision, 3);
    assert.equal(r.answers["ipip-1"], 5);
  }));
test("the saved report stays tied to the answers and is retained across same-answer autosaves", async () =>
  temp(async (store) => {
    const p = payload();
    const assessment = makeAnalysisRequest(p.session, {}, false),
      prepared = prepareAnalysis(assessment);
    p.analysis = {
      assessment,
      result: authenticateArchiveReport(
        {
          inputHash: prepared.inputHash,
          report: fixtureReport(prepared),
          model: "deepseek-flash",
          promptVersion: "test",
          knowledgeVersion: "test",
          generatedAt: new Date().toISOString(),
        },
        reportKey,
      ),
    };
    await store.save(p);
    assert.equal((await store.get(p.collection.id)).status, "reported");
    const refresh = structuredClone(p);
    refresh.collection.revision = 2;
    delete refresh.analysis;
    await store.save(refresh);
    assert.ok(
      (await store.get(p.collection.id)).analysis.report.overall.portrait,
    );
    const edit = structuredClone(p);
    edit.collection.revision = 3;
    edit.session.answers["ipip-1"] =
      edit.session.answers["ipip-1"] === 1 ? 2 : 1;
    await assert.rejects(store.save(edit), /已变更/);
    delete edit.analysis;
    await store.save(edit);
    assert.equal((await store.get(p.collection.id)).analysis, null);
  }));
test("a client cannot archive modified or unsigned report text as a DeepSeek report", async () =>
  temp(async (store) => {
    const p = payload();
    const assessment = makeAnalysisRequest(p.session, {}, false);
    const prepared = prepareAnalysis(assessment);
    const unsigned = {
      inputHash: prepared.inputHash,
      report: fixtureReport(prepared),
    };
    p.analysis = { assessment, result: unsigned };
    await assert.rejects(store.save(p), /本站生成/);
    p.analysis.result = authenticateArchiveReport(unsigned, reportKey);
    const altered = structuredClone(p);
    altered.analysis.result.report.overall.portrait.core += " 客户端修改";
    await assert.rejects(store.save(altered), /本站生成/);
    await store.save(p);
    const record = await store.get(p.collection.id);
    assert.equal(record.status, "reported");
    assert.ok(!("archiveProof" in record.analysis));
  }));
test("records survive store restart and withdrawals stop delayed uploads recreating them", async () =>
  temp(async (store, dir) => {
    const p = payload();
    await store.save(p);
    const restarted = createSubmissionStore(dir);
    assert.equal((await restarted.list()).length, 1);
    await restarted.remove(p.collection.id, p.collection.editToken);
    assert.equal((await restarted.list()).length, 0);
    p.collection.revision = 9;
    await assert.rejects(store.save(p), /已撤回/);
  }));
test("CSV keeps zero-valued answers and neutralizes spreadsheet formulas", async () =>
  temp(async (store) => {
    const p = payload();
    p.session.answers["phq-1"] = 0;
    await store.save(p);
    const r = await store.get(p.collection.id);
    assert.match(answerCSV(r), /"phq-1","phq",[^\r\n]+,"0","完全没有"/);
    assert.match(
      csv([["=1+1", 'a"b', "line\nnext"]]),
      /"'=1\+1","a""b","line\nnext"/,
    );
  }));
test("public submission does not expose records: owner access, private paths and exports are checked", async () =>
  temp(async (store, dir) => {
    const ownerKey = "owner-test-access-key-12345678901234567890";
    const app = createApp({
      env: {
        COLLECT_SUBMISSIONS: "true",
        OWNER_ACCESS_TOKEN: ownerKey,
        SUBMISSIONS_DIR: dir,
      },
    });
    app.listen(0, "127.0.0.1");
    await once(app, "listening");
    const base = "http://127.0.0.1:" + app.address().port,
      auth = { Authorization: "Bearer " + ownerKey };
    try {
      assert.equal(
        (await (await fetch(base + "/api/submissions/status")).json()).enabled,
        true,
      );
      assert.equal((await fetch(base + "/api/owner/submissions")).status, 401);
      const p = payload();
      assert.equal(
        (
          await fetch(base + "/api/submissions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(p),
          })
        ).status,
        200,
      );
      const list = await (
        await fetch(base + "/api/owner/submissions", { headers: auth })
      ).json();
      assert.equal(list.records.length, 1);
      assert.ok(!JSON.stringify(list).includes("answers"));
      const exported = await (
        await fetch(base + "/api/owner/export", { headers: auth })
      ).json();
      assert.equal(exported.records[0].answers["phq-1"], 0);
      assert.ok(!JSON.stringify(exported).includes("editTokenHash"));
      assert.equal(
        (await fetch(base + "/private-data/" + p.collection.id + ".json"))
          .status,
        404,
      );
      assert.equal(
        (
          await fetch(base + "/api/owner/submissions/" + p.collection.id, {
            method: "DELETE",
            headers: auth,
          })
        ).status,
        200,
      );
    } finally {
      app.closeAllConnections();
      await new Promise((r) => app.close(r));
    }
  }));
