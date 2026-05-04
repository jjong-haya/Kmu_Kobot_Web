export async function copyTextToClipboard(text, env = globalThis) {
  const value = String(text ?? "");
  const writeText = env?.navigator?.clipboard?.writeText;

  if (typeof writeText === "function") {
    try {
      await writeText.call(env.navigator.clipboard, value);
      return "clipboard";
    } catch {
      // Some browsers expose navigator.clipboard but reject it outside HTTPS,
      // iframe permissions, or strict user-activation paths.
    }
  }

  if (copyTextWithTextarea(value, env)) {
    return "textarea";
  }

  throw new Error("clipboard_copy_failed");
}

function copyTextWithTextarea(text, env) {
  const document = env?.document;
  const body = document?.body;

  if (
    !document ||
    !body ||
    typeof document.createElement !== "function" ||
    typeof document.execCommand !== "function" ||
    typeof body.appendChild !== "function" ||
    typeof body.removeChild !== "function"
  ) {
    return false;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "-9999px";
  textarea.style.opacity = "0";

  let copied = false;

  try {
    body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    copied = document.execCommand("copy") === true;
  } catch {
    copied = false;
  } finally {
    try {
      body.removeChild(textarea);
    } catch {
      // The fallback should never leave the hidden textarea behind.
    }
  }

  return copied;
}
