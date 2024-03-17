require("dotenv/config.js");

const { Client, RemoteAuth, MessageTypes } = require("whatsapp-web.js");
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require("mongoose");
const qrcode = require("qrcode-terminal");

const { PREFIX, stickerName, stickerAuthor } = require("./settings/config");

mongoose.connect(process.env.MONGODB_URI).then(() => {
  const store = new MongoStore({ mongoose });
  const client = new Client({
    restartOnAuthFail: true,
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    },
    ffmpegPath: "./src/settings/ffmpeg.exe",
    authStrategy: new RemoteAuth({
      store,
      backupSyncIntervalMs: 300000,
      dataPath: "./auth",
      clientId: "Emi"
    })
  });

  client.once("ready", () => {
    console.clear();
    console.log("[CLIENT] Client is ready!");

    return;
  });

  client.on("qr", (qr) => qrcode.generate(qr, { small: true }));

  client.on("remote_session_saved", () => console.log("[MONGOOSE] Remote session saved!"));

  client.on("call", async (call) => await call.reject());

  client.on("message_create", async (message) => {
    await controlChat(message);

    async function sendHelp () {
      await message.react("❌");
      await sendMessage(message, "Por favor, execute o comando *mencionando* ou *enviando* alguma imagem, vídeo ou gif!");
    }

    if (message.body == `${PREFIX}sticker`) {
      if (message.type == MessageTypes.IMAGE || message.type == MessageTypes.VIDEO) {
        await sendMessageSticker(message, (await message.downloadMedia()));
      }

      else if (message.hasQuotedMsg) {
        const quoteMsg = await message.getQuotedMessage();

        if (quoteMsg.hasMedia) await sendMessageSticker(message, (await quoteMsg.downloadMedia()));

        else await sendHelp();
      }

      else await sendHelp();
    }

    return;
  });

  client.initialize();

  async function controlChat (message) {
    const chat = await message.getChat();

    chat.sendSeen();

    if (!chat.isMuted) {
      chat.mute();
    }
  }

  async function executeOnlyOwner (message, callback) {
    const isGroup = message.from.endsWith('@g.us');

    if (!isGroup && message.from == `${process.env.OWNER_PHONE}@c.us`) return callback();
  }

  async function sendMessage (message, content, options) {
    const isGroup = message.from.endsWith('@g.us');

    if (isGroup)
      await message.reply(content, null, options);
    else
      await client.sendMessage(message.from, content, options);
  }

  async function sendMessageSticker (message, media) {
    await message.react("⌛");

    try {
      if (media) {
        sendMessage(message, media, { sendMediaAsSticker: true, stickerName, stickerAuthor })
          .then(async () => await message.react("✅"))
          .catch(async () => { await message.react("❌"); console.error(error); });
      } else {
        await message.react("❌");
        await sendMessage(message, "Infelizmente, não foi possível realizar o download desta mídia.");
      }
    } catch (error) {
      await message.react("❌");
      console.error(error);
    }
  }
});
