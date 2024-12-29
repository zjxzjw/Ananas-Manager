const vscode = require('vscode');

// 使用 VSCode 终端 API 执行命令
function executeCommandInTerminal(command) {
    const terminal = vscode.window.createTerminal('NVM Terminal');
    terminal.show();  // 显示终端
    terminal.sendText(command);  // 发送命令到终端
}

// Node 版本树节点类
class NodeVersionTreeItem extends vscode.TreeItem {
    constructor(label, version, collapsibleState, command) {
        super(label, collapsibleState);
        this.version = version;
        this.tooltip = `${label} Node.js version`;
        this.contextValue = 'nodeVersion';  // 用于指定该项的上下文

        if (command) {
            this.command = {
                command: command,
                title: "Show Node Versions",
                arguments: []
            };
        }
    }
}

// Node 版本树数据提供器类
class NodeVersionProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }

    // 获取树视图的根节点
    async getTreeItem(element) {
        return element;
    }

    // 获取树视图的数据
    async getChildren(element) {
        if (!element) {
            return this.getNodeVersions();
        }
        return [];
    }

    // 获取 Node.js 版本列表，并添加一个按钮来查看已安装的版本
    async getNodeVersions() {
        const versions = [];

        // 创建一个按钮节点，点击按钮时会显示 Node.js 版本列表
        const showButtonNode = new NodeVersionTreeItem(
            "Show Installed Node Versions",
            null,
            vscode.TreeItemCollapsibleState.None,
            'extension.showNodeVersionsInTerminal'
        );
        
        versions.push(showButtonNode);

        return versions;
    }

    // 执行命令并打开终端
    executeCommandInTerminal(command) {
        return new Promise((resolve, reject) => {
            const terminal = vscode.window.createTerminal('NVM Terminal');
            terminal.show();  // 显示终端
            terminal.sendText(command);  // 发送命令到终端

            // 给命令执行一些时间
            setTimeout(() => {
                resolve();
            }, 2000);  // 假设两秒钟足够执行命令，您可以根据需要调整这个延迟
        });
    }

    // 触发树视图更新
    refresh() {
        this._onDidChangeTreeData.fire();
    }
}

// 激活插件
function activate(context) {
    const nodeVersionProvider = new NodeVersionProvider();

    // 注册 Node.js 版本的树视图
    const treeView = vscode.window.createTreeView('nodeVersionExplorer', {
        treeDataProvider: nodeVersionProvider
    });

    // 注册查看已安装的 Node 版本的命令：点击按钮触发
    let disposable = vscode.commands.registerCommand('extension.showNodeVersionsInTerminal', async () => {
        try {
            // 执行 `nvm ls` 命令来显示已安装的 Node.js 版本
            await nodeVersionProvider.executeCommandInTerminal('nvm ls');
            vscode.window.showInformationMessage('Node.js versions displayed in terminal.');
        } catch (err) {
            vscode.window.showErrorMessage(`Failed to list Node.js versions: ${err.message}`);
        }
    });

    context.subscriptions.push(disposable);
}

// 插件停用时的清理工作
function deactivate() {}

module.exports = {
    activate,
    deactivate
};
