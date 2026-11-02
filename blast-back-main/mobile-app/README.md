# Blast Back — versão React Native

Este repositório mantém a versão web original e acrescenta uma aplicação mobile independente em `mobile-app/`, desenvolvida em **React Native com JavaScript e Expo**.

## O que foi implementado

- Telas nativas para início, sistemas, busca, detalhes do jogo, jogador e sessões salvas.
- Consulta de catálogo e metadados pela API pública do Internet Archive.
- Layout adaptativo com `useWindowDimensions`, reorganização de cartões e dimensionamento dos controles de acordo com a largura e altura disponíveis.
- Jogador incorporado com `react-native-webview`.
- Controles touch exibidos apenas no aplicativo nativo: direcional, botões A/B, Select e Start. Os botões enviam eventos de teclado ao WebView; o mapeamento segue teclas comuns de emuladores (setas, Z, X, 5 e 1).
- Persistência local de sessões e lista de jogos salvos com AsyncStorage. Ao abrir o app, a tela inicial oferece continuar o último jogo registrado.

## Executar a aplicação mobile

Requisitos: Node.js LTS e Expo Go compatível ou emulador Android/iOS.

```bash
cd mobile-app
npm install
npx expo start
```

Para abrir no Android:

```bash
npm run android
```

Para abrir no iOS (macOS com Xcode):

```bash
npm run ios
```

## Save/Load: limite importante

O aplicativo salva localmente o **identificador do jogo, título, data da sessão e tempo aproximado de uso**, e permite reabrir o mesmo jogo na próxima sessão. Isso é um salvamento de sessão/retomada, não um snapshot garantido da memória interna do emulador.

Os jogos são executados em conteúdo hospedado no Internet Archive, dentro de um WebView. Por segurança do navegador (isolamento de origem/CORS) e porque cada emulador pode implementar seu próprio formato de save, o aplicativo não consegue ler ou gravar universalmente o estado interno do jogo. Portanto, reabrir um jogo pode iniciar do começo. Para salvar exatamente a fase/posição, é necessário que o emulador daquele título exponha uma API ou exportação de save-state suportada; essa integração precisa ser feita por emulador/sistema e testada com jogos específicos.

## Controles touch: compatibilidade

Os botões virtuais enviam `keydown`/`keyup` para o documento do WebView e tentam encaminhar os eventos ao iframe quando permitido. O Internet Archive pode executar o emulador em um iframe de outra origem; nesse caso, as regras de segurança do navegador impedem o app de injetar eventos no conteúdo interno. O controle touch, portanto, depende de o emulador aceitar eventos do documento hospedeiro. Caso um título não responda, use os controles/teclas oferecidos pelo próprio emulador.

O mapeamento inicial é:
- Direcional: setas do teclado.
- A/B: Z e X.
- Select/coin: 5.
- Start: 1.

Os controles nativos não são renderizados na versão web original.

## Estrutura

- `src/`: versão web original, preservada.
- `mobile-app/App.js`: aplicação React Native em JavaScript.
- `mobile-app/package.json`: dependências e scripts Expo.
- `mobile-app/app.json`: configuração do aplicativo.

## Observações

A versão web original continua sendo executada com os comandos já documentados no README principal. A versão mobile é iniciada separadamente a partir de `mobile-app/`.
