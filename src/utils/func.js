const { MessageTypes } = require("whatsapp-web.js");

const { PREFIX, STICKER_NAME: stickerName, STICKER_AUTHOR: stickerAuthor } = require("../settings/config");

module.exports = {
  async sendMessage (message, content, options, client) {
    const isGroup = message.from.endsWith('@g.us');

    if (isGroup)
      await message.reply(content, null, options);
    else
      await client.sendMessage(message.from, content, options);
  },

  async executeOnlyOwner (message, callback) {
    const isGroup = message.from.endsWith('@g.us');

    if (!isGroup && message.from == `${process.env.OWNER_PHONE}@c.us`) return callback();
  },

  async sendMessageSticker (message, { useQuoteMsg, quoteMsg, client }) {
    await message.react("⌛");

    try {
      const media = useQuoteMsg ? quoteMsg.downloadMedia() : message.downloadMedia();

      if (media) {
        this.sendMessage(message, media, { sendMediaAsSticker: true, stickerName, stickerAuthor }, client)
          .then(async () => await message.react("✅"))
          .catch(async () => await message.react("❌"));
      } else {
        await message.react("❌");
        await this.sendMessage(message, "Infelizmente, não foi possível realizar o download desta mídia.", null, client);
      }
    } catch (error) {
      await message.react("❌");
    }
  },

  async controlChat (message) {
    const chat = await message.getChat();

    chat.sendSeen();

    if (!chat.isMuted) {
      chat.mute();
    }
  },

  async controlCommands (client, message) {
    if (message.body.startsWith(`${PREFIX}sticker`)) {
      if (message.type == MessageTypes.IMAGE || message.type == MessageTypes.VIDEO) {
        await this.sendMessageSticker(message, { useQuoteMsg: false });
      }

      else if (message.hasQuotedMsg) {
        const quoteMsg = await message.getQuotedMessage();

        if (quoteMsg.hasMedia) await this.sendMessageSticker(message, { useQuoteMsg: true, quoteMsg, client });

        else {
          await message.react("❌");
          await sendMessage(message, "Por favor, execute o comando *mencionando* ou *enviando* alguma imagem, vídeo ou gif!");
        }
      }
    }
  }
};
