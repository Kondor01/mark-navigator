import * as vscode from "vscode";
import { CommentItem } from "./commentItem";

export class CommentTreeProvider implements vscode.TreeDataProvider<CommentItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<CommentItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private comments: CommentItem[] = [];

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  updateComments(comments: { text: string; line: number }[]): void {
    this.comments = comments.map(comment => new CommentItem(comment.text, comment.line));
    this.refresh();
  }

  getTreeItem(element: CommentItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: CommentItem): Thenable<CommentItem[]> {
    return Promise.resolve(this.comments);
  }
}