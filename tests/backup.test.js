import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, upsertRide } from '../src/domain/model.js';
import { createBackup, validateBackup } from '../src/services/backup.js';

test('backup válido restaura todos os dados',()=>{const state=createInitialState();upsertRide(state,{date:'2026-09-01',status:'owner'});const restored=validateBackup(JSON.parse(JSON.stringify(createBackup(state))));assert.deepEqual(restored,state);});
test('importação rejeita backup inválido sem produzir estado',()=>{assert.throws(()=>validateBackup({format:'outro',backupVersion:1,data:{}}),/não pertence/);});
