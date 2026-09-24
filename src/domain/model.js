import { toDateKey, weekdayOf, datesInMonth } from './dates.js';

export const SCHEMA_VERSION = 1;
export const OWNER_ID = 'person-eriky';
const starterNames = ['Eriky', 'Arthur', 'Lucas', 'João', 'Maycon'];

export function createInitialState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    settings: { ownerId: OWNER_ID, fixedWeekdays: [1, 2, 3], defaultFareCents: 5000, theme: 'system' },
    people: starterNames.map((name, index) => ({ id: index === 0 ? OWNER_ID : `person-${name.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`, name, active: true, joinedOn: null })),
    rides: [],
    payments: [],
    closedMonths: []
  };
}

export function makeId(prefix = 'id') {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
}

export function isFixedDate(state, date) {
  return state.settings.fixedWeekdays.includes(weekdayOf(date));
}

export function rideForDate(state, date) {
  return state.rides.find(ride => ride.date === date) || null;
}

export function eligiblePeople(state, date) {
  return state.people.filter(person => person.active && (!person.joinedOn || person.joinedOn <= date));
}

export function upsertRide(state, input) {
  const previous = rideForDate(state, input.date);
  const extra = Boolean(input.extra);
  if (!isFixedDate(state, input.date) && !extra) throw new Error('Este dia precisa ser marcado como corrida extra.');
  if (!['owner', 'substitute', 'cancelled'].includes(input.status)) throw new Error('Situação de corrida inválida.');
  const participants = previous?.participantIds || eligiblePeople(state, input.date).map(person => person.id);
  if (input.status !== 'cancelled' && participants.length === 0) throw new Error('Não há pessoas ativas para o rateio.');
  const driverId = input.status === 'owner' ? state.settings.ownerId : input.status === 'substitute' ? input.driverId : null;
  if (input.status === 'substitute' && (!driverId || driverId === state.settings.ownerId || !participants.includes(driverId))) throw new Error('Escolha um motorista substituto válido.');
  const record = {
    id: previous?.id || makeId('ride'),
    date: input.date,
    status: input.status,
    driverId,
    extra,
    fareCents: previous?.fareCents ?? state.settings.defaultFareCents,
    participantIds: participants,
    updatedAt: new Date().toISOString()
  };
  state.rides = [...state.rides.filter(ride => ride.date !== input.date), record].sort((a, b) => a.date.localeCompare(b.date));
  return record;
}

export function removeRide(state, date) {
  state.rides = state.rides.filter(ride => ride.date !== date);
}

export function fillFixedDates(state, month, through = toDateKey()) {
  const dates = datesInMonth(month).filter(date => date <= through && isFixedDate(state, date) && !rideForDate(state, date));
  dates.forEach(date => upsertRide(state, { date, status: 'owner', extra: false }));
  return dates;
}

export function pendingFixedDates(state, through = toDateKey()) {
  const firstRideMonth = state.rides[0]?.date.slice(0, 7) || through.slice(0, 7);
  const dates = [];
  let cursor = `${firstRideMonth}-01`;
  while (cursor <= through) {
    if (isFixedDate(state, cursor) && !rideForDate(state, cursor)) dates.push(cursor);
    const date = new Date(cursor + 'T12:00:00');
    date.setDate(date.getDate() + 1);
    cursor = toDateKey(date);
  }
  return dates;
}
