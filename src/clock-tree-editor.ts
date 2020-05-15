import * as path from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';

export class ClockTreeEditorProvider implements vscode.CustomTextEditorProvider {
    private static readonly viewType = "clock-tree-editor.xboot";

	public static register(context: vscode.ExtensionContext): vscode.Disposable { 
        console.log("register")

		const provider = new ClockTreeEditorProvider(context);
		const providerRegistration = vscode.window.registerCustomEditorProvider(ClockTreeEditorProvider.viewType, provider);
		return providerRegistration;
    }
    
    constructor(
		private readonly context: vscode.ExtensionContext
    ) { }
    
    public async resolveCustomTextEditor(
		document: vscode.TextDocument,
		webviewPanel: vscode.WebviewPanel,
		_token: vscode.CancellationToken
	): Promise<void> {
        // Setup initial content for the webview
		webviewPanel.webview.options = {
			enableScripts: true,
        };

        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

        
		function updateWebview() {
			webviewPanel.webview.postMessage({
				type: 'update',
				text: document.getText(),
			});
		}

		// Hook up event handlers so that we can synchronize the webview with the text document.
		//
		// The text document acts as our model, so we have to sync change in the document to our
		// editor and sync changes in the editor back to the document.
		// 
		// Remember that a single text document can also be shared between multiple custom
		// editors (this happens for example when you split a custom editor)

		const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
			if (e.document.uri.toString() === document.uri.toString()) {
				updateWebview();
			}
		});

		// Make sure we get rid of the listener when our editor is closed.
		webviewPanel.onDidDispose(() => {
			changeDocumentSubscription.dispose();
        });
        
        // Receive message from the webview.
		webviewPanel.webview.onDidReceiveMessage(e => {
			switch (e.type) {
				case 'add':
					// this.addNewScratch(document);
					return;

				case 'delete':
					// this.deleteScratch(document, e.id);
					return;
			}
		});

		updateWebview();
    }

    /**
	 * Get the static html used for the editor webviews.
	 */
	private getHtmlForWebview(webview: vscode.Webview): string {
        const resourcePath = path.join(this.context.extensionPath, "media/index.html");
        const dirPath = path.dirname(resourcePath);
        console.log(resourcePath);
        console.log(dirPath);
        let html = fs.readFileSync(resourcePath, 'utf-8');

        /**
         * Vscode does not support direct loading of local resources, 
         * need to be replaced with its proprietary path format, here is simply to replace the style and js path
         */

        html = html.replace(/(<link.+?href="|<script.+?src="|<img.+?src=")(.+?)"/g, (m, $1, $2) => {
            return $1 + vscode.Uri.file(path.resolve(dirPath, $2)).with({ scheme: 'vscode-resource' }).toString() + '"';
        });

        return html;
	}
}