const vscode = require('vscode');

// Stats initialisées
let stats = {
	keysPressed: 0,
	filesCreated: 0,
	filesDeleted: 0,
	totalTime: 0,
	startTime: Date.now(),
	startTime2 : Date.now()
};

// Fonction pour sauvegarder les statistiques
function saveStats(context) {
	if (!context || !context.globalState) {
		console.error('Context or globalState is undefined.');
		return;
	}
	stats.totalTime += Date.now() - stats.startTime2;
	stats.startTime2 = Date.now();
	context.globalState.update('vscodeWrappedStats', stats);
	console.log('Stats saved:', stats);
}

// Fonction pour charger les statistiques depuis le stockage
function loadStats(context) {
	const savedStats = context.globalState.get('vscodeWrappedStats');
	if (savedStats) {
		stats = { ...savedStats };
		stats.startTime = Date.now();
		stats.startTime2 = Date.now();
		console.log('Stats loaded:', stats);
	} else {
		stats = {
			keysPressed: 0,
			filesCreated: 0,
			filesDeleted: 0,
			totalTime: 0,
			startTime: Date.now(),
			startTime2 : Date.now()
		};
		console.log('No saved stats found. Initialized new stats:', stats);
	}
}

// Fournisseur de données pour la Tree View
class WrappedTreeDataProvider {
	constructor(context) {
		this._onDidChangeTreeData = new vscode.EventEmitter();
		this.onDidChangeTreeData = this._onDidChangeTreeData.event;
		this.context = context;
	}

	refresh() {
		this._onDidChangeTreeData.fire(); // Rafraîchit la vue
	}

	getTreeItem(element) {
		return element;
	}

	getChildren() {
		saveStats(this.context); // Sauvegarde les stats avant de générer les enfants
		const day = new Date();
		if (day.getMonth() == 0) {
			const totalTime = formatTime(stats.totalTime);

			return [
				new vscode.TreeItem(`Keys Pressed: ${stats.keysPressed}`, vscode.TreeItemCollapsibleState.None),
				new vscode.TreeItem(`Files Created: ${stats.filesCreated}`, vscode.TreeItemCollapsibleState.None),
				new vscode.TreeItem(`Files Deleted: ${stats.filesDeleted}`, vscode.TreeItemCollapsibleState.None),
				new vscode.TreeItem(
					`Total Time: ${totalTime.hours}h ${totalTime.minutes}m ${totalTime.seconds}s`,
					vscode.TreeItemCollapsibleState.None
				),
			];
		}
	}
}

// Fonction appelée à l'activation de l'extension
function activate(context) {
	console.log('VSCode Wrapped activated!');
	loadStats(context);

	// Initialisation du TreeDataProvider
	const treeDataProvider = new WrappedTreeDataProvider(context);
	vscode.window.createTreeView('vscodeWrappedTreeView', {
		treeDataProvider,
	});

	// Listener pour les pressions de touches
	const keyPressListener = vscode.workspace.onDidChangeTextDocument(() => {
		stats.keysPressed++;
		saveStats(context);
		treeDataProvider.refresh();
	});

	// Listener pour la création de fichiers
	const fileCreateListener = vscode.workspace.onDidCreateFiles((event) => {
		stats.filesCreated += event.files.length;
		saveStats(context);
		treeDataProvider.refresh();
	});

	// Listener pour la suppression de fichiers
	const fileDeleteListener = vscode.workspace.onDidDeleteFiles((event) => {
		stats.filesDeleted += event.files.length;
		saveStats(context);
		treeDataProvider.refresh();
	});

	// Commande pour afficher les statistiques
	const showStats = vscode.commands.registerCommand('vscode-wrapped.showStats', function () {
		saveStats(context); // Sauvegarde avant d'afficher
		const total = formatTime(stats.totalTime);
		const session = formatTime(Date.now() - stats.startTime); // Temps de session
		const statsMessage = `
		🎉 **Your VS Code Wrapped Stats** 🎉
		- Keys Pressed: ${stats.keysPressed}
		- Files Created: ${stats.filesCreated}
		- Files Deleted: ${stats.filesDeleted}
		- Total Time: ${total.hours} hours ${total.minutes} minutes ${total.seconds} seconds
		- Session Time: ${session.hours} hours ${session.minutes} minutes ${session.seconds} seconds
		`;
		vscode.window.showInformationMessage(statsMessage);
	});

	// Commande pour réinitialiser les statistiques
	const resetStats = vscode.commands.registerCommand('vscode-wrapped.reset', function () {
		context.globalState.update('vscodeWrappedStats', undefined);
		vscode.window.showInformationMessage('Statistics have been reset!');
		loadStats(context);
		treeDataProvider.refresh();
	});

	// Commande pour rafraîchir la Tree View
	const refreshTreeView = vscode.commands.registerCommand('vscode-wrapped.refreshTree', function () {
		treeDataProvider.refresh();
		vscode.window.showInformationMessage('Tree View refreshed!');
	});

	// Ajouter les abonnements
	context.subscriptions.push(
		showStats,
		keyPressListener,
		fileCreateListener,
		fileDeleteListener,
		resetStats,
		refreshTreeView
	);
}

// Fonction pour formater le temps en heures, minutes, secondes
function formatTime(ms) {
	const msPerSecond = 1000;
	const msPerMinute = msPerSecond * 60;
	const msPerHour = msPerMinute * 60;

	const hours = Math.floor(ms / msPerHour);
	ms %= msPerHour;

	const minutes = Math.floor(ms / msPerMinute);
	ms %= msPerMinute;

	const seconds = Math.floor(ms / msPerSecond);

	return {
		hours,
		minutes,
		seconds,
	};
}

// Fonction appelée à la désactivation de l'extension
function deactivate() {
	console.log('VSCode Wrapped deactivated!');
}

// Export des fonctions d'activation et de désactivation
module.exports = {
	activate,
	deactivate,
};