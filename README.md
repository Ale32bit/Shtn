# Shtn
Node.js fast URL  Shortener


## Config

```javascript
{
  "name":"Shtn", // Title
  "motto":"Fast URL Shortener", // Motto
  "port":80, // Port to listen to
  "sessionSecret":"SECRET HERE", // Just put a random long string and you're OK
  "code_length": 5, // Length of newly generated codes
  "recaptcha_key": "PUBLIC", // reCaptcha v3 public key
  "recaptcha_secret": "$€¢R€Ŧ", // reCaptcha v3 secret key
  "discord_webhook": false // Discord webhook link for reports, set to false to report to console
}
```
