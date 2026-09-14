# easyapps-website

Static website for easyApps, easyPass, and easyQR.

## easyQR Smart Message URL contract

The permanent public Smart Message landing page is:

```text
https://easyapps-solutions.com/easyqr/message.html#v2=<base64url-encoded-UTF8-JSON>
```

The message payload must remain after the `#` fragment. It must not be moved into query parameters because the fragment is decoded locally in the browser and is not sent to the server as part of the HTTP request.

### V2 payload schema

```json
{
  "v": 2,
  "type": "smart_message",
  "title": "Optional message title",
  "body": "Required message body, including Unicode, emoji, and line breaks.",
  "actions": ["copy", "share", "whatsapp", "sms", "email"]
}
```

Rules:

- `v` must equal `2`.
- `type` must equal `smart_message`.
- `body` is required and must be non-empty text.
- `title` is optional text.
- `actions` is optional. When present, it may contain only `copy`, `share`, `whatsapp`, `sms`, and `email`.
- Duplicate actions are ignored.
- Malformed, oversized, unsupported-version, and invalid-schema payloads show a friendly error page.
- Payloads do not support arbitrary URLs, custom actions, HTML, or executable content.

### Privacy behavior

`easyqr/message.html` is a static client-side page. It uses Base64URL -> UTF-8 -> JSON decoding entirely in the browser, renders message content with plain-text DOM APIs, and does not use a backend, API, database, account, message storage, or analytics that receive message contents.

### Testing

Run the Smart Message decoder tests with:

```sh
node --test tests/easyqr-message.test.js
```
