require("dotenv/config.js");

const { Client, NoAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

const Func = require("./utils/func");

const client = new Client({
  restartOnAuthFail: true,
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  },
  ffmpegPath: "./src/settings/ffmpeg.exe",
  authStrategy: new NoAuth()
});

client.once("ready", () => {
  console.clear();
  console.log("Client is ready!");

  return;
});

client.on("qr", (qr) => {
  return qrcode.generate(qr, { small: true })
});

client.on("call", async (call) => {
  await call.reject()

  return;
});

client.on("message_create", async (message) => {
  await Func.controlChat(message);
  await Func.controlCommands(client, message);

  return;
});

client.initialize();
