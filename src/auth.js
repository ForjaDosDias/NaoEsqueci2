/* ===========================================================
   Não Esqueci — validação das credenciais de login/cadastro.
   Lógica pura (sem React) para ser testável isoladamente.
   Obs.: o app é um protótipo client-side — não há backend de
   autenticação; aqui validamos apenas o formato dos campos.
   =========================================================== */

export const MIN_PASSWORD = 6;

/* Retorna a mensagem de erro (string) ou null se as credenciais
   estiverem ok para o modo informado ('login' | 'signup'). */
export function validateCredentials({ mode, name, email, pw }) {
  if (!email?.trim() || !email.includes('@')) return 'Informe um e-mail válido.';
  if (mode === 'signup' && !name?.trim()) return 'Conta nova precisa de um nome.';
  if (!pw || pw.length < MIN_PASSWORD) return `A senha precisa de ao menos ${MIN_PASSWORD} caracteres.`;
  return null;
}
