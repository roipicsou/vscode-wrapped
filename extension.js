const vscode = require('vscode');

let stats = {
	keysPressed: 0,
	filesCreated: 0,
	filesDeleted: 0,
	totalTime: 0, // Temps total depuis le dernier reset
	startTime: Date.now(), // Début de la session actuelle
};

function saveStats(context) {
	// Mettre à jour le temps total accumulé
	stats.totalTime += Date.now() - stats.startTime;
	// Sauvegarder dans globalState
	context.globalState.update('vscodeWrappedStats', {
		keysPressed: stats.keysPressed,
		filesCreated: stats.filesCreated,
		filesDeleted: stats.filesDeleted,
		totalTime: stats.totalTime,
	});
}

function loadStats(context) {
	const savedStats = context.globalState.get('vscodeWrappedStats');
	if (savedStats) {
		stats = { ...savedStats };
		stats.startTime = Date.now(); // Réinitialiser le début de la session actuelle
	} else {
		stats = {
			keysPressed: 0,
			filesCreated: 0,
			filesDeleted: 0,
			totalTime: 0,
			startTime: Date.now(),
		};
	}
}

function activate(context) {
	loadStats(context);

	// Listener pour les pressions de touches
	const keyPressListener = vscode.workspace.onDidChangeTextDocument(() => {
		stats.keysPressed++;
		saveStats(context);
	});

	// Listener pour la création de fichiers
	const fileCreateListener = vscode.workspace.onDidCreateFiles((event) => {
		stats.filesCreated += event.files.length;
		saveStats(context);
	});

	// Listener pour la suppression de fichiers
	const fileDeleteListener = vscode.workspace.onDidDeleteFiles((event) => {
		stats.filesDeleted += event.files.length;
		saveStats(context);
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
	});

	// Ajouter les abonnements
	context.subscriptions.push(showStats, keyPressListener, fileCreateListener, fileDeleteListener, resetStats);
}

function formatTime(ms) {
	// Conversion des millisecondes en jours, heures, minutes, secondes
	const msPerSecond = 1000;
	const msPerMinute = msPerSecond * 60;
	const msPerHour = msPerMinute * 60;
	const msPerDay = msPerHour * 24;

	const days = Math.floor(ms / msPerDay);
	ms %= msPerDay;

	const hours = Math.floor(ms / msPerHour);
	ms %= msPerHour;

	const minutes = Math.floor(ms / msPerMinute);
	ms %= msPerMinute;

	const seconds = Math.floor(ms / msPerSecond);

	return {
		days,
		hours,
		minutes,
		seconds,
	};
}

function deactivate() {
	saveStats(); // Sauvegarde les statistiques lorsque l'extension est désactivée
}

module.exports = {
	activate,
	deactivate,
};