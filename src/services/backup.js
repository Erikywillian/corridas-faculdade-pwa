import { SCHEMA_VERSION } from '../domain/model.js';

export function createBackup(state) {
  return { format: 'corridas-faculdade', backupVersion: 1, createdAt: new Date().toISOString(), data: structuredClone(state) };
}

export function validateBackup(value) {
  if (!value || value.format !== 'corridas-faculdade' || value.backupVersion !== 1) throw new Error('Arquivo não pertence a este aplicativo ou tem versão incompatível.');
  const state = value.data;
  if (!state || state.schemaVersion !== SCHEMA_VERSION || !state.settings) throw new Error('Schema do banco incompatível.');
  for (const key of ['people', 'rides', 'payments', 'closedMonths']) if (!Array.isArray(state[key])) throw new Error(`Campo obrigatório ausente: ${key}.`);
  const people = new Set();
  for (const person of state.people) {
    if (typeof person.id !== 'string' || !person.id || typeof person.name !== 'string' || !person.name.trim() || people.has(person.id)) throw new Error('Cadastro de pessoas inválido.');
    people.add(person.id);
  }
  if (!people.has(state.settings.ownerId) || !Array.isArray(state.settings.fixedWeekdays) || !Number.isInteger(state.settings.defaultFareCents) || state.settings.defaultFareCents <= 0) throw new Error('Configurações inválidas.');
  const dates = new Set();
  for (const ride of state.rides) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ride.date) || dates.has(ride.date) || !['owner', 'substitute', 'cancelled'].includes(ride.status) || !Number.isInteger(ride.fareCents) || ride.fareCents <= 0 || !Array.isArray(ride.participantIds) || ride.participantIds.some(id => !people.has(id))) throw new Error('Histórico de corridas inválido.');
    if (ride.status === 'substitute' && !ride.participantIds.includes(ride.driverId)) throw new Error('Motorista substituto inválido.');
    dates.add(ride.date);
  }
  for (const payment of state.payments) {
    if (!people.has(payment.personId) || !Number.isInteger(payment.cents) || payment.cents <= 0 || !Array.isArray(payment.allocations) || payment.allocations.reduce((sum, item) => sum + item.cents, 0) !== payment.cents || payment.allocations.some(item => !/^\d{4}-\d{2}$/.test(item.month) || !Number.isInteger(item.cents) || item.cents <= 0)) throw new Error('Histórico de pagamentos inválido.');
  }
  return structuredClone(state);
}
