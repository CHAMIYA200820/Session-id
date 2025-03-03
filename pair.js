const express = require("express");
const fs = require("fs");
const { exec } = require("child_process");
let router = express.Router();
const pino = require("pino");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  delay,
  makeCacheableSignalKeyStore,
  Browsers,
  jidNormalizedUser,
} = require("@whiskeysockets/baileys");
const { upload } = require("./mega");

function removeFile(FilePath) {
  if (!fs.existsSync(FilePath)) return false;
  fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get("/", async (req, res) => {
  let num = req.query.number;
  async function RobinPair() {
    const { state, saveCreds } = await useMultiFileAuthState(`./session`);
    try {
      let RobinPairWeb = makeWASocket({
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(
            state.keys,
            pino({ level: "fatal" }).child({ level: "fatal" })
          ),
        },
        printQRInTerminal: false,
        logger: pino({ level: "fatal" }).child({ level: "fatal" }),
        browser: Browsers.macOS("Safari"),
      });

      if (!RobinPairWeb.authState.creds.registered) {
        await delay(1500);
        num = num.replace(/[^0-9]/g, "");
        const code = await RobinPairWeb.requestPairingCode(num);
        if (!res.headersSent) {
          await res.send({ code });
        }
      }

      RobinPairWeb.ev.on("creds.update", saveCreds);
      RobinPairWeb.ev.on("connection.update", async (s) => {
        const { connection, lastDisconnect } = s;
        if (connection === "open") {
          try {
            await delay(10000);
            const auth_path = "./session/";
            const user_jid = jidNormalizedUser(RobinPairWeb.user.id);

            function randomMegaId(length = 6, numberLength = 4) {
              const characters =
                "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
              let result = "";
              for (let i = 0; i < length; i++) {
                result += characters.charAt(
                  Math.floor(Math.random() * characters.length)
                );
              }
              const number = Math.floor(
                Math.random() * Math.pow(10, numberLength)
              );
              return `${result}${number}`;
            }

            const mega_url = await upload(
              fs.createReadStream(auth_path + "creds.json"),
              `${randomMegaId()}.json`
            );

            const string_session = `PINk_QUEEN_MD_${mega_url.replace(
              "https://mega.nz/file/",
              ""
            )}`;

            const sid = `*PINk_QUEEN_MD [The powerful WA BOT]*\n\n👉 ${string_session} 👈\n\n*
┏━━━━━━━━━━━━━━\n┃PINk QUEEN MD SESSIONS\n┃ARE\n┃CONNECTED💙🔵\n┗━━━━━━━━━━━━━━━\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n❶ || 𝐶𝑟𝑒𝑎𝑡𝑜𝑟 = CHAMINDU\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n❷ || YouTube Channel = https://youtube.com/@pinkqueenmd?si=1rET_h_GijRWIryA\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬\nPlease Follow My Support Channel https://whatsapp.com/channel/0029Vb0rCUr72WU3uq0yMg42\nWanna talk? http://wa.me/94783314361?\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n©*PINk QUEEN MD*\nශෙයා කරන්න එපා *`;
            const mg = `🛑 *Do not share this code to anyone* 🛑`;

            const dt = await RobinPairWeb.sendMessage(user_jid, {
              image: {
                url: "https://raw.githubusercontent.com/ransika2008/Img-2/refs/heads/main/High-resolution%203D%20render%2C%20warm%20hand-drawn%20sketch%20%20Embossed%20gold%20'PINK%20QUEEN%20MD'%20and%20'CONNECTED%20SUCCESSFUL'%2C%20pastel%20pink%20background%2C%20golden%20baroque%20flourishes%2C%20crown%2C%20rough%20pencil%20strokes%2C%20warm%20colors.jpg",
              },
              caption: sid,
            });

            const msg = await RobinPairWeb.sendMessage(user_jid, {
              text: string_session,
            });

            const msg1 = await RobinPairWeb.sendMessage(user_jid, { text: mg });
          } catch (e) {
            exec("pm2 restart prabath");
          }

          await delay(100);
          return await removeFile("./session");
          process.exit(0);
        } else if (
          connection === "close" &&
          lastDisconnect &&
          lastDisconnect.error &&
          lastDisconnect.error.output.statusCode !== 401
        ) {
          await delay(10000);
          RobinPair();
        }
      });
    } catch (err) {
      exec("pm2 restart Robin-md");
      console.log("service restarted");
      RobinPair();
      await removeFile("./session");
      if (!res.headersSent) {
        await res.send({ code: "Service Unavailable" });
      }
    }
  }
  return await RobinPair();
});

process.on("uncaughtException", function (err) {
  console.log("Caught exception: " + err);
  exec("pm2 restart Robin");
});

module.exports = router;
