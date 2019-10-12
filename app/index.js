import io from 'socket.io-client';
import readline from 'readline';
import clearTerminal from './modules/clearTerminal/index.js';
import createTerminalInterface from './modules/createTerminalInterface/index.js';
import printMessage from './modules/printMessage/index.js';

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

let socket;
let lastSentMessage = null;
let lastReceivedResponse = null;
let terminal = createTerminalInterface(process.stdin, process.stdout);

const resetTerminal = () => {
  terminal.close();
  clearTerminal();
  process.stdout.write(`\n\n\n VICTR | Virtual Informatics Control and Telemetry Resource\n\n System ready.\n`);
  terminal = createTerminalInterface(process.stdin, process.stdout);
  terminal.question(' Enter your query...\n\n > ', (answer) => {
    lastSentMessage = answer;
    socket.send(lastSentMessage);
    terminal.close();
  });
};

const onConnect = () => {
  console.log(`${socket.id} connected`);
  resetTerminal();
}

const onMessage = async (data) => {
  if (typeof data === 'string') {
    lastReceivedResponse = data;
    process.stdout.write('\x1Bc');
    if (lastSentMessage) {
      process.stdout.write(`\n\n\n ${lastSentMessage}\n`);
    }
    process.stdout.write(' ');
    await printMessage(`${lastReceivedResponse}`, 10);
    process.stdout.write('\n\n');
    terminal = createTerminalInterface(process.stdin, process.stdout);
    terminal.question(' > ', (answer) => {
      lastSentMessage = answer;
      socket.send(lastSentMessage);
      terminal.close();
    });
  } else {
    if (data.type === 'command') {
      switch (data.command) {
        case 'clear':
          resetTerminal();
      }
    }
  }
}

const createServer = (serverUrl) => {
  // TODO sanitize serverUrl
  socket = io(`http://${serverUrl}`);
  terminal.close();

  process.stdin.on('keypress', (str, key) => {
    if (key.ctrl && key.name === 'c') {
      socket.close();
      terminal.close();
      process.exit();
    }
  });

  socket.on('connect', onConnect);
  socket.on('message', onMessage);
};

clearTerminal();
terminal.question('\n\nEnter server url:port | ', createServer);
