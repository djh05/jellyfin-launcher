require("dotenv").config();

const express = require("express");
const axios = require("axios").default;

const config = {
  jellyfinUrl: process.env.JELLYFIN_URL,
  hassUrl: process.env.HASS_URL,
  hassToken: process.env.HASS_TOKEN,
  hassScript: process.env.HASS_SCRIPT
};

let jellyfin = {
  up: false,
  starting: false
};

async function startJellyfin() {
  if (jellyfin.up || jellyfin.starting) return;
  jellyfin.starting = true;

  console.log("Starting jellyfin...");

  await axios.post(
    config.hassUrl + "/api/services/script/" + config.hassScriptOn,
    {},
    {
      headers: {
        Authorization: "Bearer " + config.hassToken
      }
    }
  ).catch(() => {});

  await new Promise(r => setTimeout(r, 5*60*1000)); // 5 minute cooldown
  jellyfin.starting = false;
}

/**
 * Gets the current status of Jellyfin and sets `jellyfin.up` accordingly.
 * @returns The status of Jellyfin (true or false).
 */
async function getStatus() {
  let up = false;

  await axios.get(
    config.jellyfinUrl + "/System/Info/Public",
    { timeout: 1000 }
  )
  .then(() => up = true)
  .catch(() => up = false);

  jellyfin.up = up;
  return up;
}

const app = express();

app.get("/", (req, res, next) => {
  if (jellyfin.up) {
    return res.redirect(config.jellyfinUrl);

  } else {
    startJellyfin();
  }
  
  next();
});

app.use(express.static("web"));

app.listen(8095, () => {
  console.log("Listening on port 8095");
});

getStatus();
setInterval(() => getStatus(), 5000);
