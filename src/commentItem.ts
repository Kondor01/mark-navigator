import * as vscode from "vscode";

export class CommentItem extends vscode.TreeItem {
  line: number;

  constructor(label: string, line: number) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.label = label;
    this.line = line;
    this.tooltip = `Перейти к строке ${line + 1}`;
    this.command = {
      command: "sql-navigator.goToLine",
      title: "Перейти к метке",
      arguments: [line]
    };
  }
}