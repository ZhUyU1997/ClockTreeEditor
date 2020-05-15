import * as vscode from 'vscode';
import { ClockTreeEditorProvider } from './clock-tree-editor';

export function activate(context: vscode.ExtensionContext) {
	// Register our custom editor provider
	context.subscriptions.push(ClockTreeEditorProvider.register(context));
}
