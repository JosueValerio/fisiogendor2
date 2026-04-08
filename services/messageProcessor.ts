// Fase 4 — Implementado pelo Engenheiro
// Responsabilidade: receber mensagem WhatsApp, salvar, enfileirar no Redis

export async function processIncomingMessage() {
  // 1. Identificar user_id pelo número WhatsApp (multi-tenant)
  // 2. Salvar mensagem na tabela messages
  // 3. Publicar na fila Redis para processamento assíncrono
  // 4. Retornar imediatamente (não bloquear o webhook)
  throw new Error('messageProcessor: não implementado — Fase 4')
}
