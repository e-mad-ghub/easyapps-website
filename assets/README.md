# Site assets

`site.css` contains the shared Refined teal design selected from the local visual trials. Pages use local assets and system fonts; no framework or build step is required.

The Smart Message reader keeps its original Content Security Policy (`style-src 'unsafe-inline'`, `connect-src 'none'`). Its copy of the shared styles is inline in `easyqr/message.html`, after the reader-specific styles. When updating the shared design, update that inline copy as well; do not loosen the reader's CSP to load a stylesheet.

`google-play-badge.svg` is Google's unmodified English “Get it on Google Play” digital badge, downloaded on October 31, 2026 from the [official Partner Marketing Hub](https://partnermarketinghub.withgoogle.com/brands/google-play/google-play/lockups-icons-badges/?folder=86718), filename `GetItOnGooglePlay_Badge_Web_color_English.svg`. Preserve its proportions, colors, artwork, and surrounding clear space. The badge links retain the supplied app IDs and web-share campaign parameter.
