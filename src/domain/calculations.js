import { formatDate } from './dates.js';

export const formatMoney = cents => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

function splitCents(total, ids) {
  const base = Math.floor(total / ids.length);
  const remainder = total % ids.length;
  return new Map(ids.map((id, index) => [id, base + (index < remainder ? 1 : 0)]));
}

export function calculateMonth(state, month) {
  const rides = state.rides.filter(ride => ride.date.startsWith(month));
  const validRides = rides.filter(ride => ride.status !== 'cancelled');
  const ledgers = new Map();
  const ledgerFor = personId => {
    if (!ledgers.has(personId)) ledgers.set(personId, { personId, baseCents: 0, creditCents: 0, dueCents: 0, paidCents: 0, balanceCents: 0, entries: [] });
    return ledgers.get(personId);
  };

  for (const ride of validRides) {
    const shares = splitCents(ride.fareCents, ride.participantIds);
    for (const [personId, cents] of shares) {
      const ledger = ledgerFor(personId);
      ledger.baseCents += cents;
      ledger.entries.push({ kind: 'share', date: ride.date, cents });
    }
    if (ride.status === 'substitute') {
      const ledger = ledgerFor(ride.driverId);
      ledger.creditCents += ride.fareCents;
      ledger.entries.push({ kind: 'credit', date: ride.date, cents: ride.fareCents });
    }
  }

  for (const payment of state.payments) {
    const cents = payment.allocations.filter(item => item.month === month).reduce((sum, item) => sum + item.cents, 0);
    if (cents) {
      const ledger = ledgerFor(payment.personId);
      ledger.paidCents += cents;
      ledger.entries.push({ kind: 'payment', date: payment.date, cents, paymentId: payment.id });
    }
  }

  const people = [...ledgers.values()].map(ledger => ({ ...ledger, dueCents: ledger.baseCents - ledger.creditCents, balanceCents: ledger.baseCents - ledger.creditCents - ledger.paidCents }));
  return {
    month,
    rides,
    people,
    validCount: validRides.length,
    ownerCount: validRides.filter(ride => ride.status === 'owner').length,
    substituteCount: validRides.filter(ride => ride.status === 'substitute').length,
    extraCount: validRides.filter(ride => ride.extra).length,
    cancelledCount: rides.filter(ride => ride.status === 'cancelled').length,
    totalCents: validRides.reduce((sum, ride) => sum + ride.fareCents, 0)
  };
}

export function allMonths(state) {
  return [...new Set([...state.rides.map(ride => ride.date.slice(0, 7)), ...state.payments.flatMap(payment => payment.allocations.map(item => item.month))])].sort();
}

export function calculateAccumulated(state) {
  const summaries = allMonths(state).map(month => calculateMonth(state, month));
  return state.people.map(person => {
    const months = summaries.map(summary => ({ month: summary.month, ...(summary.people.find(item => item.personId === person.id) || { personId: person.id, baseCents: 0, creditCents: 0, dueCents: 0, paidCents: 0, balanceCents: 0, entries: [] }) })).filter(item => item.dueCents || item.paidCents);
    return { personId: person.id, months, dueCents: months.reduce((sum, item) => sum + item.dueCents, 0), paidCents: months.reduce((sum, item) => sum + item.paidCents, 0), balanceCents: months.reduce((sum, item) => sum + item.balanceCents, 0) };
  });
}

export function allocateOldest(state, personId, amountCents, ignoredPaymentId = null) {
  const copy = ignoredPaymentId ? { ...state, payments: state.payments.filter(payment => payment.id !== ignoredPaymentId) } : state;
  const account = calculateAccumulated(copy).find(item => item.personId === personId);
  let remaining = amountCents;
  const allocations = [];
  for (const row of account?.months || []) {
    const applicable = Math.min(remaining, Math.max(0, row.balanceCents));
    if (applicable) allocations.push({ month: row.month, cents: applicable });
    remaining -= applicable;
    if (!remaining) break;
  }
  if (remaining > 0) throw new Error('O valor é maior que o saldo em aberto.');
  return allocations;
}

export function savePayment(state, input) {
  if (!Number.isInteger(input.cents) || input.cents <= 0) throw new Error('Informe um valor válido.');
  let allocations;
  if (input.mode === 'manual') {
    allocations = input.allocations.filter(item => item.cents > 0);
    if (allocations.reduce((sum, item) => sum + item.cents, 0) !== input.cents) throw new Error('A distribuição deve somar o valor do pagamento.');
    const copy = input.id ? { ...state, payments: state.payments.filter(payment => payment.id !== input.id) } : state;
    const account = calculateAccumulated(copy).find(item => item.personId === input.personId);
    for (const allocation of allocations) {
      const row = account?.months.find(item => item.month === allocation.month);
      if (!row || allocation.cents > Math.max(0, row.balanceCents)) throw new Error(`Valor acima do saldo de ${allocation.month}.`);
    }
  } else allocations = allocateOldest(state, input.personId, input.cents, input.id);
  const payment = { id: input.id || `payment-${globalThis.crypto?.randomUUID?.() || Date.now()}`, personId: input.personId, cents: input.cents, date: input.date, note: input.note?.trim() || '', allocations };
  state.payments = [...state.payments.filter(item => item.id !== payment.id), payment].sort((a, b) => a.date.localeCompare(b.date));
  return payment;
}

export function generateSummaryText(state, month) {
  const summary = calculateMonth(state, month);
  const name = id => state.people.find(person => person.id === id)?.name || 'Pessoa';
  const title = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(`${month}-01T12:00:00`));
  const lines = [`Corridas — ${title}`, ''];
  for (const ride of summary.rides) {
    const label = ride.status === 'cancelled' ? 'Não teve aula' : ride.status === 'owner' ? name(state.settings.ownerId) : `${name(ride.driverId)} no lugar de ${name(state.settings.ownerId)}`;
    lines.push(`${formatDate(ride.date).slice(0, 5)} — ${label}${ride.extra ? ' — corrida extra' : ''}`);
  }
  lines.push('', 'Fechamento', '');
  for (const account of summary.people) {
    lines.push(name(account.personId), `Valor base: ${formatMoney(account.baseCents)}`);
    account.entries.filter(entry => entry.kind === 'credit').forEach(entry => lines.push(`${formatDate(entry.date).slice(0, 5)} — crédito por corrida: -${formatMoney(entry.cents)}`));
    lines.push(`Total: ${formatMoney(account.dueCents)}`, `Pago: ${formatMoney(account.paidCents)}`, `Falta: ${formatMoney(account.balanceCents)}`, account.balanceCents <= 0 ? 'Pago' : account.paidCents ? 'Parcial' : 'Pendente', '');
  }
  return lines.join('\n').trim();
}
