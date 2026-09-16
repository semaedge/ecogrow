# 🌱 EcoGrow: Tiny House Simulator

> Um jogo educacional de simulação hidrossanitária para ensinar princípios de saneamento ecológico através de gamificação.

[![Status](https://img.shields.io/badge/Status-Teste%20controlado-blue)]()
[![Maturidade](https://img.shields.io/badge/Maturidade-96%2F100-green)]()
[![Testes](https://img.shields.io/badge/Testes-14%20su%C3%ADtes-brightgreen)]()
[![Docs](https://img.shields.io/badge/Docs-100%25-brightgreen)]()

---

## 📖 Sobre o Projeto

**EcoGrow** é um simulador que ensina conceitos de saneamento ecológico através de um jogo de construção e gerenciamento de sistemas hidrossanitários para uma Tiny House. O jogador monta um tabuleiro 3D conectando módulos de tratamento de água, compostagem e jardinagem, buscando criar um sistema sustentável e seguro.

O ciclo operacional está em [WORKFLOW_BASICO.md](WORKFLOW_BASICO.md): sessão → sistema inicial → hipótese/edição → simulação → leitura dos alertas → decisão persistente. O score sozinho não conclui a jornada.

### 🎯 Objetivos Educacionais

- ♻️ **Economia Circular**: Reuso de recursos (água, nutrientes)
- 💧 **Segregação de Águas**: Diferença entre água cinza e água negra
- 🦠 **Saneamento**: Redução de carga patogênica
- 🌱 **Nutrição Vegetal**: Conceitos de NPK (Nitrogênio, Fósforo, Potássio)
- 🏗️ **Design Sistêmico**: Pensamento integrado e sustentável

---

## 🚀 Quick Start

### Pré-requisitos
- Conta Google (para Google Apps Script)
- Google Spreadsheet (para banco de dados)
- Conhecimentos básicos de JavaScript (opcional)

### Instalação em 5 Minutos

```bash
# 1. Clone ou copie os arquivos para um projeto Google Apps Script

# 2. Em Project Settings > Script Properties, configure:
# SPREADSHEETS_ID = ID_DA_SUA_PLANILHA

# 3. No editor do Apps Script, execute uma vez:
activateEcoGrow();

# 4. Teste o sistema:
runEngineTests();

# 5. Pronto! Acesse via doGet() URL do Web App
```

Antes do primeiro teste publicado, siga o checklist em [`PRODUCTION_CHECKLIST.md`](PRODUCTION_CHECKLIST.md).

📚 **Para instruções detalhadas**: Veja [GUIA_RAPIDO.md](GUIA_RAPIDO.md)

---

## 🎮 Como Jogar

### 1. Login/Registro
Crie sua conta ou faça login

### 2. Monte seu Tabuleiro
- Arraste módulos do inventário para o tabuleiro 3D
- Conecte entradas e saídas
- Configure plantas nos canteiros

### 3. Execute a Simulação
- Clique em "Simular"
- Aguarde o cálculo (geralmente < 1s)
- Veja seu score (0-100)

### 4. Analise o Feedback
- Verifique problemas detectados
- Ajuste seu sistema
- Tente novamente!

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────┐
│         FRONTEND (HTML/JS/CSS)          │
│   Views + Components + Visualizações    │
└──────────────────┬──────────────────────┘
                   │ google.script.run
┌──────────────────┴──────────────────────┐
│          API Router (Backend)           │
│         Roteamento de Requests          │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
┌───────▼───┐ ┌───▼────┐ ┌──▼────────┐
│Controllers│ │Services│ │   Engine  │
│  (CRUD)   │ │(Helpers)│ │(Simulação)│
└───────┬───┘ └────────┘ └──┬────────┘
        │                    │
        └────────┬───────────┘
                 │
┌────────────────▼────────────────────────┐
│ GameSheets + Models + Spreadsheet       │
│ CRUD, login, ranking e dados do jogo    │
└──────────────────────────────────────────┘
```

📚 **Mais detalhes**: [MELHORIAS_REALIZADAS.md](MELHORIAS_REALIZADAS.md)

---

## 📦 Estrutura de Arquivos

```
game/
├── Backend (.gs)
│   ├── Core
│   │   ├── Code.gs           # Ponto de entrada
│   │   └── Config.gs         # Configurações
│   ├── Auth
│   │   ├── Auth_Controller.gs
│   │   └── Auth_Service.gs
│   ├── Controllers
│   │   ├── Controller_Simulation.gs ⭐
│   │   ├── Controller_Board.gs
│   │   └── ...
│   ├── Engine
│   │   ├── Engine_Core.gs
│   │   ├── Engine_Validation.gs
│   │   ├── Engine_Sanitation.gs
│   │   └── ...
│   ├── Models
│   │   ├── Model_User.gs
│   │   ├── Model_Board.gs
│   │   └── ...
│   └── Utils
│       ├── Utils_Logger.gs
│       └── ...
│
├── Frontend (.html)
│   ├── Views/
│   ├── Components/
│   ├── Layouts/
│   └── Scripts (Js_*.html)
│
└── Docs (.md)
    ├── README.md            # Este arquivo
    ├── GUIA_RAPIDO.md       # Setup rápido
    ├── API_REFERENCE.md     # API completa
    ├── EXEMPLOS_CODIGO.md   # Exemplos
    ├── MELHORIAS_REALIZADAS.md # Changelog
    └── STATUS_ARQUIVOS.md   # Status do projeto
```

---

## 🎨 Features Principais

### ✅ Implementado (Backend)

- [x] Autenticação com tokens
- [x] CRUD completo de usuários e tabuleiros
- [x] Motor de simulação completo
  - Validação estrutural
  - Mapeamento de fluxos
  - Cálculo de patógenos
  - Balanço nutricional (NPK)
  - Distribuição de água
  - Sistema de pontuação
- [x] Sistema de economia (custos, ganhos)
- [x] Import/Export de tabuleiros (JSON)
- [x] Logs e auditoria
- [x] 6 testes integrados no Apps Script + 13 suítes locais de regressão
- [x] Documentação completa

### 🟡 Parcialmente Implementado

- [ ] Frontend (UI/UX)
  - [x] Estrutura HTML básica
  - [ ] Editor de tabuleiro (crítico) 🔥
  - [ ] Visualização 3D (crítico) 🔥
  - [ ] Drag-and-drop
  - [ ] Animações

### 📋 Planejado

- [ ] Sistema de níveis/progressão
- [ ] Tutorial interativo
- [ ] Desafios e missões
- [x] Leaderboard agregado e privado
- [ ] Multiplayer/compartilhamento
- [ ] Gráficos de estatísticas

---

## 📊 Sistema de Pontuação

### Score Total: 0-100 pontos

| Categoria | Pontos | Critérios |
|-----------|--------|-----------|
| **Sanitização** | 35 | Carga patogênica total |
| **Nutrição** | 25 | Saúde das plantas (NPK) |
| **Integridade** | 20 | Validações estruturais |
| **Cobertura** | 10 | Número de plantas |
| **Limpeza** | 10 | Ausência de contaminação |

### Classificação
- **90-100**: 🌟 Excelente
- **75-89**: ✅ Aprovado
- **60-74**: ⚠️ Aceitável
- **40-59**: ❌ Problemático
- **0-39**: 💀 Falho

---

## 🧪 Testes

### Executar Testes Unitários

```javascript
// No editor do Google Apps Script:
runEngineTests();
```

```powershell
# Na raiz do projeto: suíte local completa
node --test tests\*.test.js

# Cobertura nativa dos módulos Node instrumentáveis
node --experimental-test-coverage --test tests\*.test.js
```

A cobertura nativa do Node mede diretamente a ferramenta CLI. Os arquivos `.gs` e os scripts HTML do Apps Script são carregados em contextos VM isolados e cobertos por asserções comportamentais, contratos e cenários de integração.

### Testes Implementados
1. ✅ Tabuleiro válido
2. ✅ Estrutura inválida (módulo flutuando)
3. ✅ Contaminação por patógenos
4. ✅ Desequilíbrio nutricional
5. ✅ Mistura proibida
6. ✅ Deficiência hídrica
7. ✅ Cadastro, login, logout e CRUD de perfil
8. ✅ CRUD e ownership de tabuleiros
9. ✅ Relatórios, importação e exportação
10. ✅ Dashboard, economia, notificações e comparativos
11. ✅ Contrato frontend/backend e componentes
12. ✅ Shell responsivo e estados de acessibilidade
13. ✅ CLI e gate de maturidade

---

## 📚 Documentação

| Documento | Descrição |
|-----------|-----------|
| [GUIA_RAPIDO.md](GUIA_RAPIDO.md) | Setup em 5 minutos |
| [API_REFERENCE.md](API_REFERENCE.md) | Referência completa da API |
| [EXEMPLOS_CODIGO.md](EXEMPLOS_CODIGO.md) | Exemplos práticos |
| [MELHORIAS_REALIZADAS.md](MELHORIAS_REALIZADAS.md) | Changelog detalhado |
| [STATUS_ARQUIVOS.md](STATUS_ARQUIVOS.md) | Status de cada arquivo |

---

## 🤝 Contribuindo

### Como Contribuir

1. **Reportar bugs**: Abra uma issue descrevendo o problema
2. **Sugerir features**: Compartilhe suas ideias
3. **Implementar frontend**: A maior necessidade atual! 🔥
4. **Expandir catálogo**: Adicionar novos módulos e plantas
5. **Melhorar testes**: Cobrir mais casos de uso

### Áreas Prioritárias

1. 🔥 **CRÍTICO**: Implementar editor de tabuleiro (Js_BoardEditor.html)
2. 🔥 **CRÍTICO**: Implementar renderização 3D (Js_BoardRender.html)
3. 🟡 **ALTA**: Visualizador de fluxos (Js_Flow_Visualizer.html)
4. 🟡 **ALTA**: Cliente API completo (Js_API.html)

---

## 🛠️ Tecnologias

- **Backend**: Google Apps Script (JavaScript ES5)
- **Database**: Google Spreadsheet
- **Frontend**: HTML5 + CSS3 + Vanilla JavaScript
- **Autenticação**: CacheService (tokens)
- **API**: google.script.run

---

## ⚠️ Limitações Conhecidas

- Hash de senha com SHA-256 e salt (para produção de alto risco, prefira um provedor de identidade/KDF dedicado)
- CacheService limitado a 10MB
- Timeout de scripts: 30s (web app) / 6min (triggers)
- Frontend ainda em desenvolvimento (25% completo)

### Melhorias Planejadas

- [ ] Hash de senhas (bcrypt)
- [ ] Migrar para Cloud SQL/Firebase
- [ ] Rate limiting robusto
- [ ] WebSockets para real-time

---

## 📈 Roadmap

### Versão 1.0 (MVP) - Q1 2024
- [x] Backend completo ✅
- [ ] Editor de tabuleiro funcional
- [ ] Simulação visual
- [ ] 10+ módulos
- [ ] Tutorial básico

### Versão 1.1 - Q2 2024
- [ ] Sistema de progressão
- [ ] 30+ módulos
- [ ] Desafios semanais
- [x] Leaderboard agregado e privado

### Versão 2.0 - Q3 2024
- [ ] Multiplayer básico
- [ ] Compartilhamento de designs
- [ ] Mobile-responsive
- [ ] PWA (Progressive Web App)

---

## 📝 Licença

Este projeto é open-source para fins educacionais.

---

## 👨‍💻 Autor

**Projeto EcoGrow**  
Inspirado em: Chip's Challenge + Princípios de Saneamento Ecológico  
Desenvolvido em: Google Apps Script  

---

## 🙏 Agradecimentos

- Chuck Somerville (Chip's Challenge - inspiração de gameplay)
- Comunidade de Saneamento Ecológico (conceitos técnicos)
- Google Apps Script Community (ferramentas)

---

## 📞 Contato e Suporte

- **Documentação**: Veja os arquivos .md neste repositório
- **Bugs**: Descreva o problema em detalhes
- **Features**: Compartilhe suas ideias!

---

## 🌟 Status do Projeto

O fluxo central está implementado, incluindo editor, renderização, módulos de
fluxo e integração de API. O projeto permanece em teste controlado: publicação,
smoke test e evidências de uso em sala ainda precisam ser acompanhados no
ambiente Web App.

**Última atualização documental:** 2026-08-26  
**Estágio:** pré-piloto

---

<div align="center">

**🌱 EcoGrow - Cultivando conhecimento, sustentabilidade e diversão! 🏠💧**

[Documentação](GUIA_RAPIDO.md) • [API](API_REFERENCE.md) • [Exemplos](EXEMPLOS_CODIGO.md) • [Status](STATUS_ARQUIVOS.md)

</div>
