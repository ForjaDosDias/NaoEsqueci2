/* #3 — validação de credenciais do login/cadastro (validateCredentials).
   A senha deixou de ser decorativa: passou a ser obrigatória e validada. */
import { validateCredentials, MIN_PASSWORD } from '../src/auth.js';

let failed = 0;
const check = (name, cond) => { console.log(`${cond ? '✓' : '✗'} ${name}`); if (!cond) failed = 1; };

const ok = (mode, name, email, pw) => validateCredentials({ mode, name, email, pw });

check('e-mail inválido → erro', !!ok('login', '', 'semarroba', 'segredo123'));
check('e-mail vazio → erro', !!ok('login', '', '', 'segredo123'));
check('#3 senha vazia → erro', ok('login', '', 'a@b.com', '') === `A senha precisa de ao menos ${MIN_PASSWORD} caracteres.`);
check('#3 senha curta → erro', ok('login', '', 'a@b.com', '123') !== null);
check('#3 login com senha válida → null', ok('login', '', 'a@b.com', 'segredo123') === null);
check('signup sem nome → erro', ok('signup', '  ', 'a@b.com', 'segredo123') === 'Conta nova precisa de um nome.');
check('#3 signup completo → null', ok('signup', 'Victor', 'a@b.com', 'segredo123') === null);
check('senha no limite (6) → null', ok('login', '', 'a@b.com', '123456') === null);

process.exit(failed);
