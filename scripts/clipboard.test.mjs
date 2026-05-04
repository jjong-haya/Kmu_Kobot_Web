import test from "node:test";
import assert from "node:assert/strict";

import { copyTextToClipboard } from "../src/app/api/clipboard.js";

function createFallbackEnv({ execResult = true } = {}) {
  const commands = [];
  const appended = [];
  const removed = [];
  const textareas = [];

  const body = {
    appendChild(node) {
      appended.push(node);
      return node;
    },
    removeChild(node) {
      removed.push(node);
      return node;
    },
  };

  const document = {
    body,
    createElement(tagName) {
      assert.equal(tagName, "textarea");

      const node = {
        attributes: {},
        focusCalled: 0,
        selectCalled: 0,
        style: {},
        value: "",
        focus() {
          this.focusCalled += 1;
        },
        select() {
          this.selectCalled += 1;
        },
        setAttribute(name, value) {
          this.attributes[name] = value;
        },
      };

      textareas.push(node);
      return node;
    },
    execCommand(command) {
      commands.push(command);
      return execResult;
    },
  };

  return { env: { document }, commands, appended, removed, textareas };
}

test("copies with the async Clipboard API when the browser allows it", async () => {
  const writes = [];
  const env = {
    navigator: {
      clipboard: {
        async writeText(text) {
          writes.push(text);
        },
      },
    },
  };

  const method = await copyTextToClipboard("https://kobot.kookmin.ac.kr/invite/course?code=KOBOT", env);

  assert.equal(method, "clipboard");
  assert.deepEqual(writes, ["https://kobot.kookmin.ac.kr/invite/course?code=KOBOT"]);
});

test("falls back to a selected textarea when navigator.clipboard is blocked", async () => {
  const writes = [];
  const state = createFallbackEnv();
  const env = {
    ...state.env,
    navigator: {
      clipboard: {
        async writeText(text) {
          writes.push(text);
          throw new Error("clipboard denied");
        },
      },
    },
  };

  const method = await copyTextToClipboard("https://kobot.kookmin.ac.kr/invite/course?code=ABC123", env);

  assert.equal(method, "textarea");
  assert.deepEqual(writes, ["https://kobot.kookmin.ac.kr/invite/course?code=ABC123"]);
  assert.equal(state.textareas.length, 1);
  assert.equal(state.textareas[0].value, "https://kobot.kookmin.ac.kr/invite/course?code=ABC123");
  assert.equal(state.textareas[0].attributes.readonly, "");
  assert.equal(state.textareas[0].style.position, "fixed");
  assert.equal(state.textareas[0].style.left, "-9999px");
  assert.equal(state.textareas[0].focusCalled, 1);
  assert.equal(state.textareas[0].selectCalled, 1);
  assert.deepEqual(state.commands, ["copy"]);
  assert.deepEqual(state.appended, [state.textareas[0]]);
  assert.deepEqual(state.removed, [state.textareas[0]]);
});

test("throws a clear error when both clipboard strategies fail", async () => {
  const state = createFallbackEnv({ execResult: false });

  await assert.rejects(
    copyTextToClipboard("https://kobot.kookmin.ac.kr/invite/course?code=NOPE", state.env),
    /clipboard_copy_failed/,
  );
});
