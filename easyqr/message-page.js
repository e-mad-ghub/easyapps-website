(function () {
  "use strict";

  var smartMessage = window.EasyQRSmartMessage;
  var app = document.getElementById("app");

  window.addEventListener("error", function () {
    renderError("Network or load error", "The easyQR Smart Message reader could not finish loading. Please refresh the page and try again.");
  });

  function init() {
    if (!smartMessage) {
      renderError("Network or load error", "The easyQR Smart Message reader could not load. Please refresh the page and try again.");
      return;
    }

    try {
      renderMessage(smartMessage.parseSmartMessageHash(window.location.hash));
    } catch (error) {
      renderDecodeError(error);
    }
  }

  function renderMessage(message) {
    var displayText = smartMessage.getDisplayText(message);

    clearApp("panel");

    var eyebrow = document.createElement("p");
    eyebrow.className = "eyebrow";
    eyebrow.textContent = "Smart Message";
    app.appendChild(eyebrow);

    if (message.title) {
      var title = document.createElement("h2");
      title.className = "message-title";
      title.textContent = message.title;
      app.appendChild(title);
    }

    var body = document.createElement("p");
    body.className = "message-body";
    body.textContent = message.body;
    app.appendChild(body);

    var actions = document.createElement("div");
    actions.className = "actions";
    actions.setAttribute("aria-label", "Message actions");
    app.appendChild(actions);

    message.actions.forEach(function (action) {
      actions.appendChild(createAction(action, message, displayText));
    });

    var status = document.createElement("p");
    status.id = "action-status";
    status.className = "status";
    status.setAttribute("aria-live", "polite");
    app.appendChild(status);

    var fallback = document.createElement("div");
    fallback.className = "fallback-copy";
    fallback.id = "fallback-copy";

    var label = document.createElement("label");
    label.setAttribute("for", "fallback-copy-text");
    label.textContent = "Copy the message manually:";
    fallback.appendChild(label);

    var textarea = document.createElement("textarea");
    textarea.id = "fallback-copy-text";
    textarea.readOnly = true;
    textarea.value = displayText;
    fallback.appendChild(textarea);
    app.appendChild(fallback);
  }

  function createAction(action, message, displayText) {
    if (action === "copy") {
      return createButton("Copy", function () {
        copyText(displayText);
      });
    }

    if (action === "share") {
      return createButton("Share", function () {
        if (navigator.share) {
          navigator.share({
            title: message.title || "easyQR Smart Message",
            text: displayText
          }).then(function () {
            setStatus("Share dialog opened.");
          }).catch(function () {
            setStatus("Sharing was cancelled or unavailable.");
          });
        } else {
          copyText(displayText, "Sharing is not available in this browser. The message was copied instead.");
        }
      });
    }

    if (action === "whatsapp") {
      return createLink("WhatsApp", "https://wa.me/?text=" + encodeURIComponent(displayText));
    }

    if (action === "sms") {
      return createLink("SMS", "sms:?&body=" + encodeURIComponent(displayText));
    }

    return createLink("Email", "mailto:?subject=" + encodeURIComponent(message.title || "easyQR Smart Message") + "&body=" + encodeURIComponent(displayText));
  }

  function createButton(label, onClick) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "button";
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
  }

  function createLink(label, href) {
    var link = document.createElement("a");
    link.className = "button secondary";
    link.href = href;
    link.rel = "noopener noreferrer";
    link.textContent = label;
    return link;
  }

  function copyText(text, successMessage) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        setStatus(successMessage || "Message copied.");
      }).catch(function () {
        showManualCopy("Copy failed. You can copy the message manually below.");
      });
      return;
    }

    showManualCopy("Clipboard access is not available. You can copy the message manually below.");
  }

  function showManualCopy(message) {
    var fallback = document.getElementById("fallback-copy");
    var textarea = document.getElementById("fallback-copy-text");

    if (fallback) {
      fallback.classList.add("is-visible");
    }

    if (textarea) {
      textarea.focus();
      textarea.select();
    }

    setStatus(message);
  }

  function setStatus(message) {
    var status = document.getElementById("action-status");

    if (status) {
      status.textContent = message;
    }
  }

  function renderDecodeError(error) {
    if (error && error.code === "unsupported_version") {
      renderError("Unsupported message version", error.message);
      return;
    }

    renderError("Invalid QR message", error && error.message ? error.message : "This QR message could not be decoded.");
  }

  function renderError(title, message) {
    clearApp("panel error-panel");

    var heading = document.createElement("h2");
    heading.textContent = title;
    app.appendChild(heading);

    var text = document.createElement("p");
    text.textContent = message;
    app.appendChild(text);

    var privacy = document.createElement("p");
    privacy.textContent = "No message content was sent to a server. easyQR reads Smart Message QR data locally from the URL fragment.";
    app.appendChild(privacy);

    var back = document.createElement("a");
    back.href = "./";
    back.textContent = "Back to easyQR";
    app.appendChild(back);
  }

  function clearApp(className) {
    app.className = className;

    while (app.firstChild) {
      app.removeChild(app.firstChild);
    }
  }

  init();
})();
