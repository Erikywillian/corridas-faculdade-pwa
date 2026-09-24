# Corridas da Faculdade

PWA mobile-first para registrar corridas, calcular rateios e acompanhar pagamentos. Funciona sem backend e mantém os dados localmente no IndexedDB do navegador.

## Executar localmente

```sh
npm start
```

Abra `http://localhost:8000`. Para rodar os testes:

```sh
npm test
```

## Estrutura

- `src/domain/`: datas, entidades e cálculos financeiros puros.
- `src/services/`: casos de uso e backup versionado.
- `src/storage/`: repositório IndexedDB e ponto de migrações.
- `js/app.js`: composição e interações da interface.
- `css/app.css`: layout mobile, temas e Liquid Glass.
- `tests/`: testes de cálculos, histórico, pagamentos e backup.
- `service-worker.js` e `manifest.webmanifest`: instalação e uso offline.

## Instalar no iPhone

Publique o conteúdo em uma origem HTTPS, abra no Safari, toque em **Compartilhar** e depois em **Adicionar à Tela de Início**. Após o primeiro carregamento completo, o shell do aplicativo abre offline.

## Dados e backup

Os dados ficam no IndexedDB do navegador e não são enviados para nenhum servidor. Use **Ajustes → Exportar backup** regularmente. A importação valida formato, versão e referências antes de substituir o banco local.

Limitação: como o app é totalmente local, dados de aparelhos diferentes não são sincronizados automaticamente.
