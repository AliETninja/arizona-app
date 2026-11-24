# Contexto do arizona-app

Aplicativo do motorista da Arizona Log. Escrito em 24/11/2026. Quem for trabalhar aqui lê este arquivo antes.

## O que é

- App só do motorista (`role` `driver`). Empresa, central e cliente continuam no site.
- Feito em Expo SDK 58, com Expo Router, para iOS e Android. Não é o site dentro de um navegador: as telas são
  refeitas em componentes do React Native.
- As telas não são desenhadas do zero. A área do motorista do site (`arizona-web`) é responsiva e é o modelo: mesma
  disposição, mesmos textos, mesmas regras. Cada tela do app é o porte de um componente do site.
- Back: o mesmo do site (`arizona`, Flask). Nenhuma rota muda, com exceção do push, que não existe.

Repositórios irmãos, na mesma pasta `projects`: `arizona` (back), `arizona-web` (site, com `CONTEXTO.md` próprio).

## Regras de trabalho

- Nunca usar o travessão longo. Usar vírgula, dois-pontos ou "·".
- Código sem comentários.
- Nunca commitar nem oferecer commit. Quem commita é o Luis.
- Texto de interface vem do site, palavra por palavra. Texto que não existe no site e precisou ser criado é avisado.
- Não listar rotas nem configuração em tela ou endpoint público.
- Antes de usar uma API do Expo, conferir no pacote instalado em `node_modules` ou na doc da versão 58. O SDK muda
  a cada versão.
- Instalar biblioteca só com `npx expo install`.
- Toda entrega passa em `npm run typecheck` e `npm run lint`.
- Só mexer no `arizona-app`. Mudança necessária no back ou no site é avisada, não feita, salvo autorização.

## Decisões tomadas

| Tema | Decisão |
|---|---|
| Ambientes | Um app só, identificador `br.com.arizonalog.app`. Dev ou produção é o host, trocado dentro do app. Padrão final: produção, com opção de troca só para quem tem acesso de desenvolvimento. A regra da troca ainda será definida. Hoje o padrão é dev, porque a API de produção não tem endereço |
| Nome | "Arizona Log". Projeto na Expo: `@arizonaagronegocios/arizonalog`, id em `app.config.ts` |
| Cadastro | Fica no site. "Criar meu cadastro" abre o site num navegador dentro do app. Hoje o motorista nasce ativo; quando o KYC existir, o app mostra uma espera no ponto onde hoje checa a selfie |
| Selfie | Dentro do app, pela câmera |
| Chat | É a negociação de frete que já existe. HTTP, consulta a cada 20 s com a tela aberta, push para avisar |
| Mapa | O site mostra mapa ao motorista, então o app também. iPhone usa o mapa da Apple. Android: Google Maps com chave ou OpenStreetMap, a decidir |
| Atualização | EAS Update para código e imagens. Mudança nativa exige build novo |

## Contratos que o app usa

Todas as rotas são `POST` com JSON, salvo indicação. Sessão no cabeçalho `Authorization: Bearer <token>`. Os
contratos completos estão em `arizona-web/src/endpoints/*.schema.ts`.

- `auth/login_with_password` `{email, password}` devolve `{user, sessionToken}`. Token de 7 dias, renovado com o uso.
  `GET auth/session` devolve `{user}`. `auth/logout` encerra. `auth/request_password_reset` para a senha.
- `driver_selfie` `{action: "status"}` devolve `{needsSelfie, registrationOrigin, submittedAt}`. `save` grava a selfie
  depois do envio do arquivo por `document_upload`.
- `driver_portal` `{action: "list"}` devolve `{trips}`. `{action: "accept", id}` devolve `{driverToken}`, o token da
  corrida, de 30 dias. Recusa com 400 "selfie" se a selfie não foi feita.
- `trip` não usa a sessão, usa o `token` da corrida no corpo. `read` devolve `{detail}` com viagem, ponto atual,
  eventos e papel. `tracking {enabled, consent, operationConsent, firstPoint}` aceita e liga o rastreio.
  `positions {points}` envia de 1 a 100 pontos e devolve `{accepted}`. O motorista não avança etapa nem finaliza.
- Ponto: `id` (uuid), `latitude`, `longitude`, `accuracy`, `speed` (m/s ou null), `batteryPercentage` (obrigatório),
  `batteryCharging`, `batterySource`, `batteryReportedAt`, `recordedAt`.
- Etapas da viagem: `aguardando`, `coleta`, `carregando`, `transito`, `entrega`, `descarga`, `concluida`, `cancelada`.
- `driver_offers` `{action: "list"}` devolve `{offers}`. `{action: "interest", id, message}` abre a conversa.
- `negotiations`: `threads`, `messages` (com `group: true` e cursor `before`), `send`, `notifications` (com
  `unreadCount`) e `read`. Não há cursor de mensagens novas: relê as mensagens e usa `unreadCount`.

Regras do rastreio no site, a manter (`arizona-web/src/helpers/useDriverTracking.tsx`):

- Amostra a cada 15 s em movimento (velocidade a partir de 1,5 m/s) e a cada 60 s parado. Mudança entre parado e
  movimento força uma amostra.
- Fila local por viagem, até 1000 pontos, descartando os com mais de 24 h. Envio em lotes de até 100.
- Erro cuja mensagem casa com `encerrada|revogado|expirado|inválido|pausado|fora do período|autorize|permite
  apenas|bateria` é fatal: para e limpa a fila. Qualquer outro erro é tratado como falta de sinal e a fila fica.
- Sem amostra por mais de 180 s, avisa o motorista. Só uma viagem monitorada por aparelho.

## Telas do site que servem de modelo

| Tela do app | Componente no `arizona-web/src` |
|---|---|
| Login | `pages/login.tsx`, `components/PasswordLoginForm.tsx`, `components/ForgotPasswordDialog.tsx` |
| Selfie | `components/DriverSelfieSetup.tsx`, `components/LiveProfilePhoto.tsx` |
| Abas, corridas, histórico e viagens | `components/DriverPortal.tsx` |
| Chat | `components/NegotiationPanel.tsx`, `NegotiationNotifications.tsx`, `NegotiationFreightCard.tsx` |
| Corrida | `pages/motorista.tsx`, `components/PublicTrip.tsx`, `components/TripMap.tsx` |
| Rastreio | `helpers/useDriverTracking.tsx`, `helpers/driverDevice.tsx`, `helpers/DriverTrackingProvider.tsx` |

## Estado do código

Pronto: configuração do Expo e do EAS, permissões nativas declaradas, cliente de API, token no cofre, login,
restauração de sessão, recusa de conta que não é de motorista, checagem da selfie, abas, base comum (componentes,
contratos, domínio, polling, rotas tipadas), corridas, histórico, viagens disponíveis, chat de negociação e selfie
pela câmera.

Em andamento: tela da corrida (`src/features/trip`) e rastreio (`src/tracking`).

Etapas, na ordem:

1. Base comum: componentes com a aparência do site, contratos das rotas, esqueleto das rotas. Feita.
2. Corridas e histórico. Feita.
3. Tela da corrida: aceite, consentimento, mapa e rastreio com o app aberto. Em andamento.
4. Rastreio em segundo plano, fila sem sinal, retomada ao reabrir. Em andamento.
5. Selfie pela câmera. Feita.
6. Viagens disponíveis. Feita. O botão do cartão só abre o chat, como no site: não há diálogo de interesse.
7. Chat de negociação. Feita. A conversa nasce na primeira mensagem enviada.
8. Push, no back e no app.
9. Esqueci a senha, aviso de bateria no Android, acabamento.
10. Build das lojas.

Teste: telas no simulador do iPhone. Rastreio em segundo plano, câmera e push só em aparelho real.

## Base comum

Componentes em `src/components` (props principais):

- `Badge`: `label`, `variant?`.
- `Button`: `label`, `onPress`, `variant?`, `size?`, `icon?`, `loading?`, `disabled?`, `style?`.
- `Card`: `children?`, `featured?`, `style?`.
- `Dialog`: `visible`, `onClose`, `title`, `description?`, `children?`, `actions?`.
- `EmptyState`: `title`, `text?`, `icon?`.
- `ErrorState`: `message`, `onRetry?`.
- `ListScreen`: props do `FlatList` mais `title`, `subtitle?`, `refreshing?`, `onRefresh?`, `header?`.
- `Screen` e `ScreenHeader`: `title`, `subtitle?`, `children?`. `screenStyles` exportado.
- `Spinner`: `size?`, `color?`.
- `TextField`: props do `TextInput` mais `label`, `error?`, `multiline?`.

Funções de `src/api` (todas por `apiRequest` de `client.ts`, que também exporta `ApiError`, `apiUrl`, `apiHeaders`):

- `auth.ts`: `postLogin`, `getSession`, `postLogout`.
- `passwordReset.ts`: `postRequestPasswordReset`.
- `driverSelfie.ts`: `postDriverSelfie`, `postDriverSelfieStatus`, `saveDriverSelfie`.
- `documentUpload.ts`: `postDocumentUpload`, `startSelfieUpload`, `requestSelfieUpload`, `putFileToPresignedUrl`.
- `driverPortal.ts`: `postDriverPortal`, `listDriverTrips`, `acceptDriverTrip`.
- `driverOffers.ts`: `postDriverOffers`, `listDriverOffers`, `sendOfferInterest` (existe no contrato, o app não usa).
- `negotiations.ts`: `postNegotiations`, `listThreads`, `listNotifications`, `markNotificationsRead`, `listMessages`,
  `sendMessage`.
- `trip.ts`: `postTrip`, `readTrip`, `setTripTracking`, `sendTripPositions`. Tipos em `tripTypes.ts`.

Helpers de `src/domain`:

- `adExpiry.ts`: `adValidityMs`, `adExpiry`, `adExpired`.
- `format.ts`: `formatTripTime`, `formatCoordinate`, `formatDayMonthTime`, `formatDateTimeShort`,
  `formatDateTimeFull`, `formatFreight`, `formatCep`, `formatSpeedKmh`, `formatAccuracyMeters`.
- `negotiations.ts`: `groupNegotiations`, `negotiationTimeline`.
- `tripList.ts`: `mergeTripList`, `mergeTripDetail`.
- `tripStages.ts`: `stageOrder`, `stageLabels`, `isTerminalStage`, `isHistoryTrip`, `isActiveTrip`, `staleSignalMs`,
  `tripSignal`.
- `tripToken.ts`: `isTripToken`.

Consulta periódica (`src/hooks/usePolling.ts`): `usePolling(intervalMs, enabled?)` devolve o intervalo só com o app
ativo e a tela em foco, senão `false`; `useAppActive()`. Constantes: `tripsPollMs` 10000, `negotiationsPollMs` 20000,
`offersPollMs` 20000, `slowPollMs` 60000.

Navegação (`src/navigation/routes.ts`): `tripHref(tripId)` e `negotiationHref(opportunityId)` devolvem `Href`, com o
único cast do app. Todo `router.push` para corrida ou negociação passa por eles.

Pastas por feature, cada uma de um dono:

- `src/features/trips`: lista de corridas e histórico.
- `src/features/offers`: viagens disponíveis.
- `src/features/chat`: lista de conversas e conversa de negociação.
- `src/features/trip`: tela da corrida.
- `src/features/selfie`: selfie pela câmera.
- `src/tracking`: rastreio.

## Pendências externas

Nenhuma trava o código. Travam teste em aparelho, push ou publicação.

Da Arizona:

- Confirmar o identificador `br.com.arizonalog.app`. Depois de registrado nas lojas não muda. Se o app já foi
  registrado em alguma loja com outro identificador, informar qual.
- Situação da conta Apple Developer (havia pendência) e acesso de administrador ou gerente de app para o Luis.
- Tipo da conta Google Play: pessoal ou de empresa. Conta pessoal criada depois de novembro de 2023 exige teste
  fechado com 12 testadores por 14 dias antes de publicar.
- Acesso do Luis ao Google Play Console.
- Ícone do app (1024 x 1024) e tela de abertura.
- Nome do app nas lojas, descrição curta e longa, e-mail de suporte e site de marketing.
- Política de privacidade pública cobrindo localização em segundo plano.
- Conta de motorista de teste para os revisores das lojas.
- Um aparelho Android para testar o rastreio em segundo plano.

Do Luis:

- Registrar o app no App Store Connect e no Google Play Console com o identificador confirmado.
- Chave de API do App Store Connect e conta de serviço do Google Play, para envio automático de builds.
- Projeto no Firebase ligado ao `arizonaagronegocios`, app Android registrado, `google-services.json` e chave do
  Firebase Cloud Messaging cadastrada na Expo. Só para o push.
- Chave de push da Apple: a Expo gera no primeiro build, com a conta ativa.
- Endereço da API de produção, que depende do DNS.
- Decidir o mapa no Android. Se for Google Maps, criar a chave no projeto da Arizona.
- Declaração de localização em segundo plano no Google Play, com vídeo, e questionários de privacidade nas duas
  lojas. Só na publicação.

No back (`arizona`), quando chegar o push: entidade para o aparelho do motorista, rota de registro e disparo ao
chegar mensagem na negociação.

Textos criados para o app, a confirmar: permissões de localização e câmera, "Este aplicativo é exclusivo para
caminhoneiros." e os rótulos curtos das abas (Corridas, Viagens, Chat, Histórico), "Abrir configurações" (selfie), o rótulo de
acessibilidade "Voltar" e "Enviando…" (chat).
