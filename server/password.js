import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { hashPassword } from './security.js';

let muted = false;
const output = new Writable({ write(chunk, encoding, callback) { if (!muted) process.stdout.write(chunk, encoding); callback(); } });
const prompt = createInterface({ input: process.stdin, output, terminal: Boolean(process.stdin.isTTY) });
process.stdout.write('Новый пароль владельца (минимум 12 символов): '); muted = true;
const password = await prompt.question('');
prompt.close(); process.stdout.write('\n');
if (password.length < 12) { console.error('Используйте не менее 12 символов'); process.exit(1); }
console.log(`ADMIN_PASSWORD_HASH=${hashPassword(password)}`);
