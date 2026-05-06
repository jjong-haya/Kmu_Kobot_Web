import assert from "node:assert/strict";
import test from "node:test";

globalThis.window = {
  location: {
    origin: "https://kobot.kookmin.ac.kr",
  },
};

const { isChunkLoadErrorReason, isStaleChunkAssetUrl } = await import(
  "../src/app/utils/chunkLoadRecovery.ts"
);

test("detects stale Vite chunk served as an HTML module", () => {
  assert.equal(
    isChunkLoadErrorReason(
      'Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "text/html". Strict MIME type checking is enforced for module scripts per HTML spec.',
    ),
    true,
  );
});

test("detects failed dynamic imports caused by a removed deployment chunk", () => {
  assert.equal(
    isChunkLoadErrorReason(
      "TypeError: Failed to fetch dynamically imported module: https://kobot.kookmin.ac.kr/assets/InviteCodes-47fqZF48.js",
    ),
    true,
  );
});

test("recognizes Vite asset chunks without treating app routes as chunks", () => {
  assert.equal(isStaleChunkAssetUrl("/assets/InviteCodes-47fqZF48.js"), true);
  assert.equal(isStaleChunkAssetUrl("https://kobot.kookmin.ac.kr/assets/tags-CDmeMmK5.js"), true);
  assert.equal(isStaleChunkAssetUrl("/member/invite-codes"), false);
});

test("ignores unrelated application errors", () => {
  assert.equal(isChunkLoadErrorReason("게시글 제목을 입력해 주세요."), false);
  assert.equal(isChunkLoadErrorReason(new Error("permission denied")), false);
});
