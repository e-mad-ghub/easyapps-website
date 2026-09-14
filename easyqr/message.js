(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.EasyQRSmartMessage = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var MAX_ENCODED_LENGTH = 12000;
  var MAX_BODY_LENGTH = 8000;
  var MAX_TITLE_LENGTH = 240;
  var ALLOWED_ACTIONS = ["copy", "share", "whatsapp", "sms", "email"];

  function fail(code, message) {
    var error = new Error(message);
    error.code = code;
    throw error;
  }

  function parseSmartMessageHash(hash) {
    if (typeof hash !== "string" || hash.indexOf("#v2=") !== 0) {
      fail("missing", "This QR code does not contain a readable easyQR Smart Message.");
    }

    return decodeSmartMessagePayload(hash.slice(4));
  }

  function decodeSmartMessagePayload(encoded) {
    if (typeof encoded !== "string" || encoded.length === 0) {
      fail("missing", "This QR code does not contain a readable easyQR Smart Message.");
    }

    if (encoded.length > MAX_ENCODED_LENGTH) {
      fail("oversized", "This QR message is too large to display safely.");
    }

    var jsonText = decodeBase64UrlUtf8(encoded);
    var value;

    try {
      value = JSON.parse(jsonText);
    } catch (error) {
      fail("invalid_json", "This QR message is corrupted or incomplete.");
    }

    return validateSmartMessagePayload(value);
  }

  function decodeBase64UrlUtf8(encoded) {
    if (!/^[A-Za-z0-9_-]+$/.test(encoded)) {
      fail("malformed", "This QR message contains malformed encoded data.");
    }

    var base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    var paddingLength = (4 - (base64.length % 4)) % 4;
    base64 += "=".repeat(paddingLength);

    try {
      if (typeof Buffer !== "undefined") {
        return Buffer.from(base64, "base64").toString("utf8");
      }

      var binary = atob(base64);
      var bytes = new Uint8Array(binary.length);

      for (var index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
      }

      return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch (error) {
      fail("malformed", "This QR message contains malformed encoded data.");
    }
  }

  function validateSmartMessagePayload(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      fail("invalid_schema", "This QR message is not in the expected easyQR format.");
    }

    if (value.v !== 2) {
      if (typeof value.v === "number" && value.v > 2) {
        fail("unsupported_version", "This QR message uses a newer format that this page does not support yet.");
      }

      fail("invalid_schema", "This QR message is not in the expected easyQR format.");
    }

    if (value.type !== "smart_message") {
      fail("invalid_schema", "This QR message is not in the expected easyQR format.");
    }

    if (typeof value.body !== "string" || value.body.trim().length === 0) {
      fail("invalid_schema", "This QR message does not include a message body.");
    }

    if (value.body.length > MAX_BODY_LENGTH) {
      fail("oversized", "This QR message is too large to display safely.");
    }

    if (value.title !== undefined && typeof value.title !== "string") {
      fail("invalid_schema", "This QR message title is invalid.");
    }

    if (typeof value.title === "string" && value.title.length > MAX_TITLE_LENGTH) {
      fail("oversized", "This QR message title is too large to display safely.");
    }

    var actions = normalizeActions(value.actions);

    return {
      v: 2,
      type: "smart_message",
      title: typeof value.title === "string" ? value.title : "",
      body: value.body,
      actions: actions
    };
  }

  function normalizeActions(actions) {
    if (actions === undefined) {
      return [];
    }

    if (!Array.isArray(actions)) {
      fail("invalid_schema", "This QR message actions list is invalid.");
    }

    var seen = {};
    var normalized = [];

    actions.forEach(function (action) {
      if (typeof action !== "string" || ALLOWED_ACTIONS.indexOf(action) === -1) {
        fail("invalid_schema", "This QR message includes an unsupported action.");
      }

      if (!seen[action]) {
        seen[action] = true;
        normalized.push(action);
      }
    });

    return normalized;
  }

  function getDisplayText(message) {
    if (message.title) {
      return message.title + "\n\n" + message.body;
    }

    return message.body;
  }

  return {
    ALLOWED_ACTIONS: ALLOWED_ACTIONS.slice(),
    decodeBase64UrlUtf8: decodeBase64UrlUtf8,
    decodeSmartMessagePayload: decodeSmartMessagePayload,
    getDisplayText: getDisplayText,
    parseSmartMessageHash: parseSmartMessageHash,
    validateSmartMessagePayload: validateSmartMessagePayload
  };
});
