const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

const API_KEY = "7725234301:AAHNN-o67wqJtwra17elRxRi9vq9-x1knng";
const bot = new TelegramBot(API_KEY, { polling: true });
const DATA_FILE = 'userData.json';

// Load user data from file or initialize empty object
let userData = {};
if (fs.existsSync(DATA_FILE)) {
    userData = JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveUserData() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(userData));
}

function sendLanguagePrompt(chatId) {
    const options = {
        reply_markup: {
            keyboard: [["O'zbek", "Русский"]],
            resize_keyboard: true,
            one_time_keyboard: true,
        },
    };
    bot.sendMessage(chatId, "Tilni tanlang / Выберите язык", options);
}

function sendClassPrompt(chatId, language) {
    const classOptions = [
        ["7-A", "7-B", "7-V"],
        ["8-A", "8-B", "8-V"],
        ["9-A", "9-B", "9-V", "9-G"],
        ["10-A", "10-B", "10-V", "10-G"],
        ["11-A", "11-B"],
    ];
    const message = language === "O'zbek" 
        ? "Bolangizning sinfini tanlang:"
        : "Выберите класс вашего ребенка:";

    const options = {
        reply_markup: {
            keyboard: classOptions,
            resize_keyboard: true,
            one_time_keyboard: true,
        },
    };
    bot.sendMessage(chatId, message, options);
}

function validatePhoneNumber(phone) {
    const phonePattern = /^\+998\d{9}$/;
    return phonePattern.test(phone);
}

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Initialize user data if not present
    if (!userData[chatId]) {
        userData[chatId] = {};
        saveUserData();
    }

    const user = userData[chatId];

    try {
        if (!user.language) {
            if (text !== "O'zbek" && text !== "Русский") {
                return sendLanguagePrompt(chatId);
            }
            user.language = text;
            saveUserData();

            const welcomeMessage = user.language === "O'zbek"
                ? "Assalomu aleykum OIS ota-onalar bilimi tomonidan yaratılan botga Xush kelibsiz.\nBu yerda siz o'z murojaatlaringizni yo'llashingiz mumkin."
                : "Добро пожаловать в бот, созданный знанием родителей OIS.\nЗдесь вы можете отправить свои запросы.";

            bot.sendMessage(chatId, welcomeMessage);
            bot.sendMessage(chatId, user.language === "O'zbek"
                ? "Ismingiz va familiyangizni kiriting:"
                : "Введите ваше имя и фамилию:");
        } else if (!user.parentName) {
            user.parentName = text;
            saveUserData();
            bot.sendMessage(chatId, user.language === "O'zbek"
                ? "Farzandingizning ismi va familiyasini kiriting:"
                : "Введите имя и фамилию вашего ребенка:");
        } else if (!user.childName) {
            user.childName = text;
            saveUserData();
            sendClassPrompt(chatId, user.language);
        } else if (!user.childClass) {
            const validClasses = ["7-A", "7-B", "7-V", "8-A", "8-B", "8-V", "9-A", "9-B", "9-V", "9-G", "10-A", "10-B", "10-V", "10-G", "11-A", "11-B"];
            if (!validClasses.includes(text)) {
                return sendClassPrompt(chatId, user.language);
            }
            user.childClass = text;
            saveUserData();
            bot.sendMessage(chatId, user.language === "O'zbek"
                ? "Telefon raqamingizni kiriting: (+998 XX XXX XX XX)"
                : "Введите ваш номер телефона: (+998 XX XXX XX XX)");
        } else if (!user.phone) {
            if (!validatePhoneNumber(text)) {
                return bot.sendMessage(chatId, user.language === "O'zbek"
                    ? "Telefon raqamini to'g'ri formatda kiriting: (+998 XX XXX XX XX)"
                    : "Введите номер телефона в правильном формате: (+998 XX XXX XX XX)");
            }
            user.phone = text;
            saveUserData();
            bot.sendMessage(chatId, user.language === "O'zbek"
                ? "Murojaatingizni yozing:"
                : "Напишите ваш запрос:");
        } else if (!user.request) {
            user.request = text;
            saveUserData();
            console.log(`Request Submitted:`, user);
            const message = user.language === "O'zbek"
                ? "Murojaatingiz yuborildi!\nAgar yana murojaat yubormoqchi bo'lsangiz tugmani bosing:"
                : "Ваш запрос был отправлен!\nЕсли вы хотите отправить ещё один запрос, нажмите кнопку:";

            const options = {
                reply_markup: {
                    keyboard: [["Yana murojaat yuborish", "Отправить другой запрос"]],
                    resize_keyboard: true,
                    one_time_keyboard: true,
                },
            };
            bot.sendMessage(chatId, message, options);
        } else if (text === "Yana murojaat yuborish" || text === "Отправить другой запрос") {
            userData[chatId] = { language: user.language };
            saveUserData();
            bot.sendMessage(chatId, user.language === "O'zbek"
                ? "Ismingiz va familiyangizni kiriting:"
                : "Введите ваше имя и фамилию:");
        } else {
            bot.sendMessage(chatId, user.language === "O'zbek"
                ? "Iltimos, tugmani bosing:"
                : "Пожалуйста, нажмите кнопку:");
        }
    } catch (error) {
        console.error(`Error handling message:`, error);
        bot.sendMessage(chatId, user.language === "O'zbek"
            ? "Kechirasiz, tizimda xatolik yuz berdi. Keyinroq urinib ko'ring."
            : "Извините, произошла ошибка в системе. Попробуйте позже.");
    }
});

