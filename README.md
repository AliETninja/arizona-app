# arizona-app

Aplicativo do motorista da Arizona Log, em Expo (SDK 58), para iOS e Android. Consome a mesma API do site
(`arizona`), com a mesma sessão por token no cabeçalho `Authorization`.

## O que já existe

- Login do motorista por e-mail e senha. Conta que não é de motorista é recusada.
- Sessão guardada no cofre do aparelho e restaurada ao abrir o app.
- "Criar meu cadastro" abre o cadastro do caminhoneiro no site, dentro de um navegador do próprio app.
- Consulta da selfie obrigatória ao entrar. Quem ainda não enviou cai numa tela própria, ainda sem a câmera.
- Quatro abas, ainda sem conteúdo: Corridas, Viagens, Chat e Histórico.

## O que falta

| Parte | Rotas do back |
|---|---|
| Selfie pela câmera | `driver_selfie`, `document_upload` |
| Viagens disponíveis e interesse | `driver_offers` |
| Chat de negociação, com consulta a cada 20 segundos | `negotiations` |
| Corridas e histórico | `driver_portal` |
| Aceite e rastreio em segundo plano | `driver_portal` (`accept`), `trip` (`read`, `tracking`, `positions`) |
| Push de mensagem nova | não existe no back, precisa de rota para registrar o aparelho |
| Esqueci a senha | `auth/request_password_reset` |

## Estrutura

```
app.config.ts          nome, identificador, permissões e endereços por ambiente
eas.json               perfis de build e canais de atualização
src/app                rotas (Expo Router): cada arquivo é uma tela
src/app/login.tsx      tela de entrada
src/app/(driver)       área logada, com as abas
src/api                cliente HTTP e chamadas por rota
src/session            token no cofre e estado de autenticação
src/config             leitura do ambiente
src/theme              cores e medidas, as mesmas do site
src/components         botão, campo de texto e moldura de tela
```

## Ambientes

O ambiente vem da variável `APP_ENV` (`development` ou `production`), lida em `app.config.ts`. Sem a variável, vale
`development`.

| | development | production |
|---|---|---|
| Nome | Arizona Log-dev | Arizona Log |
| Identificador | `br.com.arizonalog.app.dev` | `br.com.arizonalog.app` |
| API | `https://ms-arizona-dev-c6hgw5heia-rj.a.run.app` | vazio, preencher quando existir |
| Site | `https://ms-arizona-web-dev-c6hgw5heia-rj.a.run.app` | `https://arizonalog.com.br` |

Os dois identificadores são diferentes, então o app de dev e o de produção convivem no mesmo aparelho.

## Rodar

O app usa localização em segundo plano, câmera e notificação, que não existem no Expo Go. Precisa de um build de
desenvolvimento instalado no aparelho.

```bash
npm install
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build --profile development --platform android
npx expo start --dev-client
```

O `eas init` cria o projeto na Expo e devolve um id. Esse id entra como `EAS_PROJECT_ID`, que liga as atualizações
sem loja.

Conferir o código:

```bash
npm run typecheck
npm run lint
```

## Build e atualização

| Perfil | Para quê | Canal |
|---|---|---|
| `development` | build de desenvolvimento, com recarga de código | `development` |
| `dev` | build interno apontando para o back de dev | `dev` |
| `production` | build das lojas | `production` |

Atualização sem passar pela loja (só código JavaScript e imagens):

```bash
npx eas-cli@latest update --channel production --message "descrição"
```

Mudança em biblioteca nativa, permissão, ícone, nome ou versão do Expo exige build novo. A atualização só chega a
quem tem um build com a mesma versão do app (`version` em `app.config.ts`).
