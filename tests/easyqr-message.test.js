const test = require("node:test");
const assert = require("node:assert/strict");
const smartMessage = require("../easyqr/message.js");

function encodePayload(value) {
  return Buffer.from(JSON.stringify(value), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

test("decodes Base64URL UTF-8 text", () => {
  const encoded = Buffer.from("Hello easyQR", "utf8").toString("base64url");
  assert.equal(smartMessage.decodeBase64UrlUtf8(encoded), "Hello easyQR");
});

test("accepts a valid V2 payload", () => {
  const payload = {
    v: 2,
    type: "smart_message",
    title: "Visit desk",
    body: "Please check in at reception.",
    actions: ["copy", "share"]
  };

  assert.deepEqual(smartMessage.decodeSmartMessagePayload(encodePayload(payload)), payload);
});

test("accepts a missing title", () => {
  const message = smartMessage.decodeSmartMessagePayload(encodePayload({
    v: 2,
    type: "smart_message",
    body: "Body only",
    actions: ["copy"]
  }));

  assert.equal(message.title, "");
  assert.equal(smartMessage.getDisplayText(message), "Body only");
});

test("preserves Unicode, emoji, and multiline body text", () => {
  const body = "مرحبا\nHello 🌍\nLine three";
  const message = smartMessage.decodeSmartMessagePayload(encodePayload({
    v: 2,
    type: "smart_message",
    title: "Unicode ✅",
    body,
    actions: ["email"]
  }));

  assert.equal(message.title, "Unicode ✅");
  assert.equal(message.body, body);
  assert.equal(smartMessage.getDisplayText(message), "Unicode ✅\n\n" + body);
});

test("rejects malformed Base64URL encoding", () => {
  assert.throws(
    () => smartMessage.decodeSmartMessagePayload("not valid!!"),
    { code: "malformed" }
  );
});

test("rejects invalid JSON", () => {
  const encoded = Buffer.from("{bad json", "utf8").toString("base64url");
  assert.throws(
    () => smartMessage.decodeSmartMessagePayload(encoded),
    { code: "invalid_json" }
  );
});

test("rejects unsupported future versions", () => {
  assert.throws(
    () => smartMessage.decodeSmartMessagePayload(encodePayload({
      v: 3,
      type: "smart_message",
      body: "Future",
      actions: ["copy"]
    })),
    { code: "unsupported_version" }
  );
});

test("rejects invalid actions", () => {
  assert.throws(
    () => smartMessage.decodeSmartMessagePayload(encodePayload({
      v: 2,
      type: "smart_message",
      body: "Do not open arbitrary URLs",
      actions: ["copy", "open_url"]
    })),
    { code: "invalid_schema" }
  );
});

test("ignores duplicate actions", () => {
  const message = smartMessage.decodeSmartMessagePayload(encodePayload({
    v: 2,
    type: "smart_message",
    body: "Copy once",
    actions: ["copy", "copy", "sms"]
  }));

  assert.deepEqual(message.actions, ["copy", "sms"]);
});

test("keeps XSS-like content as plain text data", () => {
  const body = "<img src=x onerror=alert(1)><script>alert('x')</script>";
  const message = smartMessage.decodeSmartMessagePayload(encodePayload({
    v: 2,
    type: "smart_message",
    title: "<b>Hello</b>",
    body,
    actions: ["copy"]
  }));

  assert.equal(message.title, "<b>Hello</b>");
  assert.equal(message.body, body);
  assert.equal(smartMessage.getDisplayText(message), "<b>Hello</b>\n\n" + body);
});

test("rejects missing body", () => {
  assert.throws(
    () => smartMessage.decodeSmartMessagePayload(encodePayload({
      v: 2,
      type: "smart_message",
      actions: ["copy"]
    })),
    { code: "invalid_schema" }
  );
});
