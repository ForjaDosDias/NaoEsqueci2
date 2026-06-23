/* #11.3 — nfceDate valida o dhEmi (YYYYMMDDHHMMSS) antes de construir
   a data, evitando overflow silencioso (mês 00, dia 00 etc.). */
import { nfceDate } from '../src/nfce.js';

let failed = 0;
const check = (name, cond) => { console.log(`${cond ? '✓' : '✗'} ${name}`); if (!cond) failed = 1; };

const d = nfceDate({ dhEmi: '20260611103122' });
check('dhEmi válido → Date correta', d instanceof Date && d.getFullYear() === 2026 && d.getMonth() === 5 && d.getDate() === 11);

check('mês 00 → null', nfceDate({ dhEmi: '20260011103122' }) === null);
check('dia 00 → null', nfceDate({ dhEmi: '20260600103122' }) === null);
check('mês 13 → null', nfceDate({ dhEmi: '20261311103122' }) === null);
check('dia 32 → null', nfceDate({ dhEmi: '20260632103122' }) === null);
check('dia 31 inexistente (abril) → null', nfceDate({ dhEmi: '20260431103122' }) === null);
check('sem dhEmi → null', nfceDate({}) === null);

/* fallback ISO continua funcionando */
const iso = nfceDate({ dhEmi: '2026-06-11T10:31:22-03:00' });
check('dhEmi ISO → Date', iso instanceof Date && iso.getFullYear() === 2026);

process.exit(failed);
