# Corridas da Faculdade

Estrutura inicial de um **PWA mobile-first**, com foco principal em **iPhone**.
O desenvolvimento futuro será focado em **calendário, corridas e pagamentos**.
A lógica de negócio ainda não foi implementada.

## Diretrizes

- Funcionamento 100% local no dispositivo, sem backend, sem Supabase e sem login.
- Armazenamento futuro em IndexedDB; nenhuma base de dados é criada nesta etapa.
- Funcionamento offline após o primeiro carregamento online e a conclusão do cache.
- Sem serviços externos, bibliotecas remotas ou etapa de build.
- Os dados futuros ficarão no navegador: não haverá sincronização entre dispositivos.

## Executar localmente

Com Python 3 instalado, execute na raiz do projeto:

```sh
python -m http.server 8000
```

Abra `http://localhost:8000`. Não abra o HTML diretamente com `file://`.
O service worker precisa de HTTPS ou localhost. Para testar no iPhone, use uma
origem HTTPS acessível pelo aparelho; o IP local do notebook via HTTP não atende
a esse requisito. No Safari, use Compartilhar → Adicionar à Tela de Início.

## Organização

| Caminho | Responsabilidade futura |
| --- | --- |
| `index.html`, `css/`, `js/` | Página inicial, estilos e inicialização |
| `src/domain/` | Entidades e regras de calendário, corridas e pagamentos |
| `src/services/` | Casos de uso |
| `src/repositories/` | Interfaces de acesso aos dados |
| `src/storage/` | Conexão, esquema e migrações do IndexedDB |
| `src/ui/` | Componentes e interação com a interface |
| `tests/` | Testes futuros |
| `assets/icons/` | Ícones PNG provisórios do PWA e da Tela de Início |

As pastas reservadas contêm `.gitkeep` para serem preservadas pelo Git.
O manifest usa caminhos relativos para permitir hospedagem em subdiretórios.
O service worker armazena somente os arquivos iniciais listados em `SHELL`.
Ao modificar esses arquivos, incremente a versão do cache em `service-worker.js`.
Uma atualização aguarda o fechamento das páginas que usam a versão anterior.

## Validação inicial

```sh
node --check js/app.js
node --check service-worker.js
```

Para verificar offline, aguarde a mensagem de disponibilidade offline, recarregue
a página e então desative a rede e recarregue novamente. A página inicial deve abrir.
Ainda não há suíte de testes de negócio, pois o aplicativo não foi implementado.

## Continuidade do desenvolvimento

O repositório contém todos os arquivos necessários para retomar o trabalho em
outro ambiente a partir da branch `main`. Não é necessário instalar dependências
nem executar serviços locais do notebook para editar o projeto em um ambiente remoto.
Implemente futuramente o domínio, a persistência IndexedDB e a interface conforme
as diretrizes acima, preservando o funcionamento local e offline.
