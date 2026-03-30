import * as vscode from "vscode";
import { CommentTreeProvider } from "./commentTreeProvider";

let treeProvider: CommentTreeProvider;

export function activate(context: vscode.ExtensionContext) {
  treeProvider = new CommentTreeProvider();

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("sqlNavigator", treeProvider)
  );

  // Команда: переход к строке
  const goToLine = vscode.commands.registerCommand(
    "sql-navigator.goToLine",
    (line: number) => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const range = editor.document.lineAt(line).range;
        editor.revealRange(range);
        editor.selection = new vscode.Selection(line, 0, line, 0);
      }
    }
  );

  // Команда: вставка метки
  const insertComment = vscode.commands.registerCommand(
    "sql-navigator.insertComment",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const config = vscode.workspace.getConfiguration("sqlNavigator");
      if (!config.get("enabled")) return;

      // Получаем список шаблонов
      let patterns: string[] = config.get("commentPatterns") || [];
      if (patterns.length === 0) patterns = ["--*"]; // fallback

      // Выбираем шаблон
      let selectedPattern: string;
      if (patterns.length === 1) {
        selectedPattern = patterns[0];
      } else {
        const picked = await vscode.window.showQuickPick(patterns, {
          placeHolder: "Выберите шаблон комментария"
        });
        if (!picked) return;
        selectedPattern = picked;
      }

      const position = editor.selection.active;
      editor.edit(editBuilder => {
        editBuilder.insert(position, `${selectedPattern} `);
      });
    }
  );

  // Слушаем изменения настроек и текста
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration("sqlNavigator")) {
        parseComments();
      }
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(e => {
      if (
        vscode.window.activeTextEditor &&
        e.document === vscode.window.activeTextEditor.document
      ) {
        parseComments();
      }
    })
  );

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(editor => {
      parseComments();
    })
  );

  function parseComments() {
    const editor = vscode.window.activeTextEditor;
    const config = vscode.workspace.getConfiguration("sqlNavigator");

    if (
      !config.get("enabled") ||
      !editor ||
      !editor.document.fileName.endsWith(".sql")
    ) {
      treeProvider.updateComments([]);
      return;
    }

    // Получаем шаблоны
    let patterns: string[] = config.get("commentPatterns") || [];
    if (patterns.length === 0) patterns = ["--*"];

    // Строим одно регулярное выражение из всех шаблонов
    const regexParts = patterns.map(p => `${escapeRegExp(p)}.*`);
    const regex = new RegExp(regexParts.join("|"));

    const comments: { text: string; line: number }[] = [];
    const lineCount = editor.document.lineCount;
    for (let i = 0; i < lineCount; i++) {
      const line = editor.document.lineAt(i).text;
      if (regex.test(line.trim())) {
        comments.push({ text: line.trim(), line: i });
      }
    }

    treeProvider.updateComments(comments);
  }

  function escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // Инициализация
  if (vscode.window.activeTextEditor) {
    parseComments();
  }

  context.subscriptions.push(goToLine, insertComment);
}

export function deactivate() {}