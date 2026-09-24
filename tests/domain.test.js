import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, fillFixedDates, upsertRide } from '../src/domain/model.js';
import { allocateOldest, calculateAccumulated, calculateMonth, savePayment } from '../src/domain/calculations.js';

const stateFor = () => createInitialState();

test('divide o valor igualmente e preserva todos os centavos', () => {
  const state=stateFor();upsertRide(state,{date:'2026-09-01',status:'owner'});const summary=calculateMonth(state,'2026-09');
  assert.equal(summary.totalCents,5000);assert.equal(summary.people.reduce((sum,p)=>sum+p.baseCents,0),5000);assert.deepEqual(summary.people.map(p=>p.baseCents),[1000,1000,1000,1000,1000]);
});
test('motorista substituto recebe crédito do valor integral',()=>{const state=stateFor();upsertRide(state,{date:'2026-09-02',status:'substitute',driverId:'person-maycon'});const row=calculateMonth(state,'2026-09').people.find(p=>p.personId==='person-maycon');assert.equal(row.baseCents,1000);assert.equal(row.creditCents,5000);assert.equal(row.dueCents,-4000);});
test('dia sem corrida não entra no rateio',()=>{const state=stateFor();upsertRide(state,{date:'2026-09-07',status:'cancelled'});const summary=calculateMonth(state,'2026-09');assert.equal(summary.validCount,0);assert.equal(summary.cancelledCount,1);assert.equal(summary.totalCents,0);});
test('corrida extra entra no cálculo',()=>{const state=stateFor();upsertRide(state,{date:'2026-09-03',status:'owner',extra:true});const summary=calculateMonth(state,'2026-09');assert.equal(summary.extraCount,1);assert.equal(summary.totalCents,5000);});
test('pagamento parcial reduz o saldo mensal',()=>{const state=stateFor();upsertRide(state,{date:'2026-09-01',status:'owner'});savePayment(state,{personId:'person-arthur',cents:400,date:'2026-09-10',mode:'oldest'});const row=calculateMonth(state,'2026-09').people.find(p=>p.personId==='person-arthur');assert.equal(row.paidCents,400);assert.equal(row.balanceCents,600);});
test('quitação zera o saldo',()=>{const state=stateFor();upsertRide(state,{date:'2026-09-01',status:'owner'});savePayment(state,{personId:'person-arthur',cents:1000,date:'2026-09-10',mode:'oldest'});assert.equal(calculateMonth(state,'2026-09').people.find(p=>p.personId==='person-arthur').balanceCents,0);});
test('pagamento acumulado é aplicado aos meses mais antigos',()=>{const state=stateFor();upsertRide(state,{date:'2026-08-03',status:'owner'});upsertRide(state,{date:'2026-09-01',status:'owner'});const allocations=allocateOldest(state,'person-arthur',1500);assert.deepEqual(allocations,[{month:'2026-08',cents:1000},{month:'2026-09',cents:500}]);});
test('saldo acumulado soma os saldos mensais',()=>{const state=stateFor();upsertRide(state,{date:'2026-08-03',status:'owner'});upsertRide(state,{date:'2026-09-01',status:'owner'});const row=calculateAccumulated(state).find(p=>p.personId==='person-lucas');assert.equal(row.balanceCents,2000);});
test('mudança de participantes não altera histórico',()=>{const state=stateFor();upsertRide(state,{date:'2026-08-03',status:'owner'});state.people.find(p=>p.id==='person-lucas').active=false;upsertRide(state,{date:'2026-09-01',status:'owner'});assert.equal(calculateMonth(state,'2026-08').people.find(p=>p.personId==='person-lucas').baseCents,1000);assert.equal(calculateMonth(state,'2026-09').people.some(p=>p.personId==='person-lucas'),false);});
test('preenchimento automático não sobrescreve registros',()=>{const state=stateFor();upsertRide(state,{date:'2026-09-01',status:'cancelled'});const dates=fillFixedDates(state,'2026-09','2026-09-09');assert.equal(dates.length,4);assert.equal(state.rides.find(r=>r.date==='2026-09-01').status,'cancelled');assert.equal(state.rides.length,5);});
