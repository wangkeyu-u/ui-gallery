export const COLLECTION_VERSION = "2026-11-16-v1";
export function normalizeCollection(value) {
  if (
    !value ||
    value.version !== COLLECTION_VERSION ||
    value.granted !== true ||
    typeof value.label !== "string" ||
    value.label.length > 40 ||
    typeof value.id !== "string" ||
    !/^([a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12})$/i.test(
      value.id,
    ) ||
    typeof value.editToken !== "string" ||
    !/^[a-f0-9]{64}$/.test(value.editToken) ||
    !Number.isSafeInteger(value.revision) ||
    value.revision < 1
  )
    throw Error("提交授权或保存凭据不完整。");
  return {
    version: COLLECTION_VERSION,
    granted: true,
    label: value.label.trim(),
    id: value.id.toLowerCase(),
    editToken: value.editToken,
    revision: value.revision,
  };
}
export function newCollection(label = "") {
  return normalizeCollection({
    version: COLLECTION_VERSION,
    granted: true,
    label: label.trim().slice(0, 40),
    id: crypto.randomUUID(),
    editToken: Array.from(crypto.getRandomValues(new Uint8Array(32)), (x) =>
      x.toString(16).padStart(2, "0"),
    ).join(""),
    revision: 1,
  });
}
