const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

// 获取 NVM 配置的路径
function getNvmPath() {
    const config = vscode.workspace.getConfiguration('nodeVersionManager');
    const nvmPath = config.get('nvmPath') || '';  // 获取配置中的 nvmPath
    return nvmPath;
}

// 解析 NVM 路径中的 Node 版本
function getNodeVersionsFromNvm(nvmPath) {
    const nodeVersions = [];
    const versionsDir = nvmPath;  // NVM 目录本身，版本文件夹直接在这个目录下
    
    if (fs.existsSync(versionsDir)) {
        const versions = fs.readdirSync(versionsDir);

        // 只取文件夹中以 "v" 开头的版本
        versions.forEach((version) => {
            const versionDir = path.join(versionsDir, version);
            // 检查文件夹是否以 "v" 开头
            if (fs.statSync(versionDir).isDirectory() && version.startsWith('v')) {
                nodeVersions.push(version);  // 保留 'v' 前缀，直接添加到版本列表
            }
        });
    }

    return nodeVersions;
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
                title: "Switch Node Version",
                arguments: [version]  // 把版本作为参数传递给命令
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

    // 获取 Node.js 版本列表，并显示到视图
    async getNodeVersions() {
        const nodeVersions = [];
        const nvmPath = getNvmPath();

        if (!nvmPath) {
            vscode.window.showErrorMessage('NVM path not configured.');
            return [];
        }

        const versions = getNodeVersionsFromNvm(nvmPath);
        
        if (versions.length === 0) {
            vscode.window.showInformationMessage('No Node.js versions found.');
            return [];
        }

        // 创建每个版本的树节点
        versions.forEach(version => {
            const versionNode = new NodeVersionTreeItem(
                version,  // 保留 'v' 前缀直接作为标签
                version,
                vscode.TreeItemCollapsibleState.None,
                'extension.switchNodeVersion'  // 设置点击版本时的命令
            );
            nodeVersions.push(versionNode);
        });

        return nodeVersions;
    }

    // 切换 Node 版本
    executeCommandInTerminal(command) {
        return new Promise((resolve, reject) => {
            const terminal = vscode.window.createTerminal('NVM Terminal');
            terminal.show();
            terminal.sendText(command);
            resolve();
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

    // 注册切换 Node 版本的命令
    let disposable = vscode.commands.registerCommand('extension.switchNodeVersion', async (version) => {
        try {
            const nvmPath = getNvmPath();
            if (!nvmPath) {
                vscode.window.showErrorMessage('NVM path is not configured.');
                return;
            }
            await nodeVersionProvider.executeCommandInTerminal(`nvm use ${version}`);
            vscode.window.showInformationMessage(`Switched to Node.js version ${version}`);
        } catch (err) {
            vscode.window.showErrorMessage(`Failed to switch Node.js version: ${err.message}`);
        }
    });

    context.subscriptions.push(disposable);
}

// 停用插件
function deactivate() {}

module.exports = {
    activate,
    deactivate
};
