import { fillFixedDates, isFixedDate, removeRide, rideForDate, upsertRide } from '../domain/model.js';
import { savePayment } from '../domain/calculations.js';
import { createBackup, validateBackup } from './backup.js';

export class AppService {
  constructor(repository) { this.repository = repository; this.state = null; }
  async init() { this.state = await this.repository.load(); return this.state; }
  async commit(action) { action(this.state); await this.repository.save(this.state); return this.state; }
  assertMonthOpen(month) { if (this.state.closedMonths.includes(month)) throw new Error('Este mês está fechado. Reabra para editar.'); }
  saveRide(input) { this.assertMonthOpen(input.date.slice(0, 7)); return this.commit(state => upsertRide(state, input)); }
  deleteRide(date) { this.assertMonthOpen(date.slice(0, 7)); return this.commit(state => removeRide(state, date)); }
  fillMonth(month, through) { this.assertMonthOpen(month); let dates; return this.commit(state => { dates = fillFixedDates(state, month, through); }).then(() => dates); }
  toggleMonth(month) { return this.commit(state => { state.closedMonths = state.closedMonths.includes(month) ? state.closedMonths.filter(item => item !== month) : [...state.closedMonths, month].sort(); }); }
  addPayment(input) { return this.commit(state => savePayment(state, input)); }
  deletePayment(id) { return this.commit(state => { state.payments = state.payments.filter(item => item.id !== id); }); }
  savePerson(input) { return this.commit(state => {
    const name = input.name.trim();
    if (!name) throw new Error('Informe o nome.');
    if (input.id) state.people = state.people.map(person => person.id === input.id ? { ...person, name, active: input.active, joinedOn: input.joinedOn || null } : person);
    else state.people.push({ id: `person-${globalThis.crypto?.randomUUID?.() || Date.now()}`, name, active: input.active, joinedOn: input.joinedOn || null });
  }); }
  saveSettings(settings) { return this.commit(state => { state.settings = { ...state.settings, ...settings }; }); }
  exportBackup() { return createBackup(this.state); }
  async importBackup(value) { const state = validateBackup(value); this.state = state; await this.repository.save(state); return state; }
  ride(date) { return rideForDate(this.state, date); }
  isFixed(date) { return isFixedDate(this.state, date); }
}
