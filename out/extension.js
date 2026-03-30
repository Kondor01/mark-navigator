"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const commentTreeProvider_1 = require("./commentTreeProvider");
let treeProvider;
function activate(context) {
    treeProvider = new commentTreeProvider_1.CommentTreeProvider();
    context.subscriptions.push(vscode.window.registerTreeDataProvider("sqlNavigator", treeProvider));
    // Команда: переход к строке
    const goToLine = vscode.commands.registerCommand("sql-navigator.goToLine", (line) => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const range = editor.document.lineAt(line).range;
            editor.revealRange(range);
            editor.selection = new vscode.Selection(line, 0, line, 0);
        }
    });
    // Команда: вставка метки
    const insertComment = vscode.commands.registerCommand("sql-navigator.insertComment", async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        const config = vscode.workspace.getConfiguration("sqlNavigator");
        if (!config.get("enabled"))
            return;
        // Получаем список шаблонов
        let patterns = config.get("commentPatterns") || [];
        if (patterns.length === 0)
            patterns = ["--*"]; // fallback
        // Выбираем шаблон
        let selectedPattern;
        if (patterns.length === 1) {
            selectedPattern = patterns[0];
        }
        else {
            const picked = await vscode.window.showQuickPick(patterns, {
                placeHolder: "Выберите шаблон комментария"
            });
            if (!picked)
                return;
            selectedPattern = picked;
        }
        const position = editor.selection.active;
        editor.edit(editBuilder => {
            editBuilder.insert(position, `${selectedPattern} `);
        });
    });
    // Слушаем изменения настроек и текста
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration("sqlNavigator")) {
            parseComments();
        }
    }));
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(e => {
        if (vscode.window.activeTextEditor &&
            e.document === vscode.window.activeTextEditor.document) {
            parseComments();
        }
    }));
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(editor => {
        parseComments();
    }));
    function parseComments() {
        const editor = vscode.window.activeTextEditor;
        const config = vscode.workspace.getConfiguration("sqlNavigator");
        if (!config.get("enabled") ||
            !editor ||
            !editor.document.fileName.endsWith(".sql")) {
            treeProvider.updateComments([]);
            return;
        }
        // Получаем шаблоны
        let patterns = config.get("commentPatterns") || [];
        if (patterns.length === 0)
            patterns = ["--*"];
        // Строим одно регулярное выражение из всех шаблонов
        const regexParts = patterns.map(p => `${escapeRegExp(p)}.*`);
        const regex = new RegExp(regexParts.join("|"));
        const comments = [];
        const lineCount = editor.document.lineCount;
        for (let i = 0; i < lineCount; i++) {
            const line = editor.document.lineAt(i).text;
            if (regex.test(line.trim())) {
                comments.push({ text: line.trim(), line: i });
            }
        }
        treeProvider.updateComments(comments);
    }
    function escapeRegExp(text) {
        return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
    // Инициализация
    if (vscode.window.activeTextEditor) {
        parseComments();
    }
    context.subscriptions.push(goToLine, insertComment);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map