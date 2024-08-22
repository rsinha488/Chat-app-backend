const mongoose = require('mongoose');

const BasicThemeSchema = new mongoose.Schema({
    primaryColor: { type: String, required: true },
    secondaryColor: { type: String, required: true },
    primaryTextColor: { type: String, required: true },
    secondaryTextColor: { type: String, required: true }
});

const ActiveQuizSchema = new mongoose.Schema({
    backgroundColor: { type: String, required: true },
    textColor: { type: String, required: true },
    fontFamily: { type: String, required: true },
    fontSize: { type: String, required: true }
});

const ChatSchema = new mongoose.Schema({
    backgroundColor: { type: String, required: true },
    backgroundImage: { type: String },
    textColor: { type: String, required: true },
    userChatBackgroundColor: { type: String, required: true },
    titleBackgroundColor: { type: String, required: true },
    titleTextColor: { type: String, required: true },
    fontFamily: { type: String, required: true },
    fontSize: { type: String, required: true },
    bubbleIconImage: { type: String },
    bubbleBackgroundColor: { type: String, required: true },
    chatRulesTitle: { type: String },
    chatMessagesTextColor: { type: String },
    chatMessagesBackgroundColor: { type: String, required: true },
    chatMessagesReplyTextColor: { type: String, required: true },
    chatMessagesReplyBackgroundColor: { type: String, required: true },
    commentReactionsPanelBackgroundColor: { type: String },
    hashTagTextColor: { type: String, required: true }
});

// Define schemas for other sections similarly

const ThemeSchema = new mongoose.Schema({
    theme: BasicThemeSchema,
    activeQuiz: ActiveQuizSchema,
    chat: ChatSchema,
    // Add other sub-schemas here
    header: {
        logo: { type: String, required: true },
        backgroundColor: { type: String, required: true },
        textColor: { type: String, required: true },
        fontFamily: { type: String, required: true },
        fontSize: { type: String, required: true }
    },
    sideBar: {
        backgroundColor: { type: String, required: true },
        textColor: { type: String, required: true }
    },
    // Continue for all other sections
    menu: {
        friendsMenuLocation: {
            on_chat_screen: { type: Boolean, required: true },
            in_hamburger_menu: { type: Boolean, required: true }
        },
        fanzonesMenuLocation: {
            in_hamburger_menu: { type: Boolean, required: true }
        },
        leaderboardMenuLocation: {
            in_hamburger_menu: { type: Boolean, required: true }
        },
        profileMenuLocation: {
            in_hamburger_menu: { type: Boolean, required: true }
        },
        helpMenuLocation: {
            in_hamburger_menu: { type: Boolean, required: true }
        }
    },
    Other: {
        supportEmail: { type: String }
    }
});

const ThemeModel = mongoose.model('Theme', ThemeSchema);

module.exports = ThemeModel;
