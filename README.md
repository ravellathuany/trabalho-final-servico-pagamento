# Serviço de Pagamento - Pipeline de Integração Contínua

## 📋 Visão Geral do Projeto

Este projeto implementa um **Serviço de Pagamento** com automatização de testes através de uma **pipeline de Integração Contínua (CI)** utilizando **GitHub Actions**.

### O que é o Serviço de Pagamento?

A classe `ServicoDePagamento` oferece funcionalidades de:
- **Registrar pagamentos** com categorização automática:
  - Categoria **"padrão"**: para valores ≤ R$ 100,00
  - Categoria **"cara"**: para valores > R$ 100,00
- **Consultar o último pagamento** registrado no histórico

---

## 🔄 Conceitos de CI/CD

### O que é Integração Contínua (CI)?

Integração Contínua é uma prática de engenharia de software que permite aos desenvolvedores **integrar código frequentemente** (muitas vezes por dia) em um repositório compartilhado. Cada integração é verificada automaticamente através de:

- ✅ **Testes automatizados**
- ✅ **Análise de código**
- ✅ **Geração de relatórios**
- ✅ **Deploy automático** (quando aplicável)

### Por que usar CI/CD?

| Benefício | Descrição |
|-----------|-----------|
| **Detecção rápida de problemas** | Erros são encontrados minutos após o código ser integrado, não dias depois |
| **Confiabilidade** | Testes automatizados garantem que alterações não quebrem funcionalidades existentes |
| **Velocidade de desenvolvimento** | Reduz tempo gasto em testes manuais e integração manual |
| **Rastreabilidade** | Cada execução deixa um registro auditável de status, testes e artefatos |
| **Feedback contínuo** | Desenvolvedores recebem feedback imediato sobre a saúde do código |

### GitHub Actions

**GitHub Actions** é um serviço de automação nativo do GitHub que permite:
- Definir workflows em YAML
- Executar jobs em resposta a eventos (push, pull request, schedule, etc.)
- Usar actions pré-construídas ou criar customizadas
- Armazenar artefatos (relatórios, builds, logs)
- Publicar conteúdo estático (GitHub Pages)

---

## 🏗️ Arquitetura da Pipeline

A pipeline de CI deste projeto segue a seguinte estrutura:

```
Evento Disparador
    │
    ├─ Push em qualquer branch
    ├─ Execução manual (workflow_dispatch)
    └─ Agendado diariamente (schedule)
    
    ↓

Job: test-and-report
    ├─ Checkout do código
    ├─ Setup Node.js 18.x
    ├─ Cache de dependências
    ├─ Instalação de dependências
    ├─ Execução de testes + geração de relatório HTML
    ├─ Upload de artifacts (30 dias de retenção)
    └─ Upload para GitHub Pages (branch main apenas)
    
    ↓

Job: deploy-pages (condicional)
    └─ Deploy do relatório em GitHub Pages
       (URL persistente e acessível publicamente)
```

### Fluxo de Execução Detalhado

1. **Checkout**: GitHub Actions faz download do código do repositório
2. **Setup Node.js**: Instala a versão 18.x do Node.js no runner
3. **Cache**: Recupera dependências npm cached (mais rápido que reinstalar)
4. **Install**: Executa `npm install` para instalar `mocha`, `mochawesome` e `mochawesome-report-generator`
5. **Test**: Executa `npm run test:report` que:
   - Roda todos os 7 testes com Mocha
   - Gera JSON com resultados via `--reporter json`
   - Processa JSON para criar HTML interativo via `mochawesome-report-generator`
6. **Upload Artifacts**: Armazena relatório HTML como artifact (baixável por 30 dias)
7. **Deploy Pages**: Se for branch `main`, publica relatório em GitHub Pages

---

## 🎯 Tipos de Triggers

Existem 3 formas diferentes de executar esta pipeline:

### 1️⃣ Trigger por Push (Automático)

**Quando dispara?**
- Cada vez que você faz `git push` para qualquer branch

**Configuração no workflow:**
```yaml
on:
  push:
    branches: ['**']
```

**Vantagem:** Feedback imediato após alterações locais

**Exemplo de uso:**
```bash
git add .
git commit -m "Adiciona nova funcionalidade"
git push origin feature/nova-pagamento
# → Pipeline executa automaticamente
```

---

### 2️⃣ Trigger Manual (workflow_dispatch)

**Quando dispara?**
- Quando você clica no botão **"Run workflow"** na UI do GitHub
- Útil para executar testes sem fazer commit de novo código

**Configuração no workflow:**
```yaml
on:
  workflow_dispatch:
```

**Vantagem:** Teste código específico manualmente, sem novo push

**Como usar:**
1. Acesse: `https://github.com/[seu-usuario]/[seu-repo]/actions`
2. Clique em **"CI Pipeline"** (nome do workflow)
3. Clique em **"Run workflow"**
4. Selecione a branch desejada
5. Clique em **"Run workflow"** novamente
6. Aguarde execução (típico: 30-60 segundos)

---

### 3️⃣ Trigger Agendado (Schedule/Cron)

**Quando dispara?**
- Diariamente às **00:00 UTC** (meia-noite UTC)
- Útil para detectar regressões causadas por mudanças externas

**Configuração no workflow:**
```yaml
on:
  schedule:
    - cron: '0 0 * * *'
```

**Formato Cron explicado:**
```
0 0 * * *
│ │ │ │ │
│ │ │ │ └─ Dia da semana (0=domingo, 6=sábado) → * = todos
│ │ │ └─── Mês (1-12) → * = todos
│ │ └───── Dia do mês (1-31) → * = todos
│ └─────── Hora (0-23) → 0 = 00:00
└───────── Minuto (0-59) → 0 = :00
```

**Exemplos de cron customizados:**
- `0 8 * * MON` = Segundas-feiras às 08:00 UTC
- `0 */6 * * *` = A cada 6 horas
- `30 2 * * *` = Diariamente às 02:30 UTC

**⚠️ Nota de Timezone:** O cron usa UTC. Se você está em outro fuso, calcule a diferença:
- UTC-3 (São Paulo): 00:00 UTC = 21:00 do dia anterior em SP
- Para executar 8:00 AM SP, use `11 * * * *` (11:00 UTC)

**Vantagem:** Detecta problemas não-óbvios e degenerações de performance

---

## 📊 Geração e Armazenamento de Relatórios

### Como os Relatórios são Gerados?

1. **Mocha** executa os testes e coleta resultados
2. **JSON Reporter** do Mocha serializa resultados em `.mochawesome.json`
3. **mochawesome-report-generator** processa JSON e gera HTML interativo

### Script npm responsável:
```bash
npm run test:report
```

Este comando executa:
```bash
mocha --reporter json > .mochawesome.json && \
mochawesome-report-generator .mochawesome.json -o mochawesome-reports -inline
```

### Onde os Relatórios são Armazenados?

#### 📦 **Artifacts (Curto Prazo)**
- **Localização**: GitHub Actions → Workflow Run → "test-results-{numero}"
- **Duração**: 30 dias (configurável)
- **Acesso**: Histórico completo de todas as execuções
- **Vantagem**: Fácil de baixar e comparar execuções antigas

**Como acessar:**
1. Vá para `https://github.com/[seu-usuario]/[seu-repo]/actions`
2. Clique na execução desejada (workflow run)
3. Desça até "Artifacts"
4. Clique em `test-results-{numero}` para baixar
5. Extraia o ZIP e abra `mochawesome-reports/index.html` no navegador

#### 🌐 **GitHub Pages (Longo Prazo)**
- **URL**: `https://[seu-usuario].github.io/[seu-repo]/`
- **Duração**: Persistente
- **Conteúdo**: Relatório da execução mais recente (branch `main`)
- **Vantagem**: Link compartilhável e sempre atualizado

**Como acessar:**
1. Após execução bem-sucedida, aguarde 1-2 minutos
2. Navegue para `https://[seu-usuario].github.io/[seu-repo]/`
3. Visualize relatório interativo HTML

**⚠️ Nota importante:**
- GitHub Pages publica apenas relatórios da branch `main`
- Execuções em outras branches armazenam apenas em Artifacts
- Configure repositório como público para ativar GitHub Pages

---

## 🚀 Como Usar a Pipeline

### Executar Testes Localmente

```bash
# Testes simples (sem relatório)
npm test

# Resultado esperado:
# ✓ Pagar
# ✓ Consultar último pagamento
# 7 passing (45ms)
```

### Gerar Relatório HTML Localmente

```bash
npm run test:report

# Resultado: pasta 'mochawesome-reports/' criada
# Abra em navegador: mochawesome-reports/index.html
```

### Verificar Status da Pipeline no GitHub

1. Faça um push: `git push`
2. Vá para: `https://github.com/[seu-usuario]/[seu-repo]/actions`
3. Clique no commit mais recente
4. Acompanhe execução em tempo real
5. Após conclusão, verifique:
   - ✅ Status do job (sucesso/falha)
   - 📦 Artifacts disponíveis
   - 🌐 Link GitHub Pages (se branch main)

### Entender a Saída dos Logs

Na UI do GitHub Actions, você verá logs detalhados de cada step:

```
✓ Checkout code (1.23s)
✓ Setup Node.js (4.56s)
✓ Cache npm dependencies (0.89s)
✓ Install dependencies (12.34s)
✓ Run tests with report generation (2.15s)
  ├─ 7 passing
  └─ Report: mochawesome-reports/index.html
✓ Upload test report as artifact (0.45s)
✓ Upload artifact for GitHub Pages deployment (1.23s)

deploy-pages
✓ Deploy to GitHub Pages (2.34s)
✓ Deployment complete: https://[seu-usuario].github.io/[seu-repo]/
```

---

## 📚 Referência de Dependências

| Ferramenta | Versão | Propósito |
|-----------|--------|----------|
| **Node.js** | 18.x LTS | Runtime JavaScript |
| **npm** | nativa | Gerenciador de pacotes |
| **Mocha** | ^10.2.0 | Framework de testes |
| **mochawesome** | ^7.1.3 | Reporter JSON + customizações |
| **mochawesome-report-generator** | ^5.2.0 | Gerador de HTML interativo |

---

## 🐛 Troubleshooting

### ❌ Pipeline falha no step "Install dependencies"

**Possíveis causas:**
- Versão incompatível de Node.js
- Problema com pacote npm

**Solução:**
```bash
# Limpe cache local
rm -rf node_modules package-lock.json
npm install

# Commit e push
git add package.json package-lock.json
git push
```

---

### ❌ Relatório HTML não aparece em GitHub Pages

**Possíveis causas:**
- Repositório está em branch que não é `main`
- GitHub Pages não está ativado
- Repositório é privado

**Solução:**
1. Verifique que você fez push para `main` (não em outra branch)
2. Em GitHub → Settings → Pages → Source: Verifique se é "GitHub Actions"
3. Se repositório é privado, pergunte ao owner para ativar GitHub Pages
4. Aguarde 2-3 minutos após workflow bem-sucedido

---

### ❌ Workflow não executa automaticamente

**Possíveis causas:**
- Workflow desativado no repositório
- Eventos de push não acionam corretamente

**Solução:**
1. GitHub → Actions → Verifique se "CI Pipeline" está ativo (não desativado)
2. Teste manualmente: Actions → "CI Pipeline" → "Run workflow"
3. Se manual funciona mas push não, verifique o arquivo `.github/workflows/ci.yml`

---

### ⚠️ Agendamento (schedule) não executa

**Possível causa:**
- Repositório não teve atividade em 60 dias (GitHub desativa automaticamente)
- Cron syntax incorreta

**Solução:**
1. Faça qualquer commit e push para reativar
2. Verifique cron syntax em https://crontab.guru/
3. Vá para Actions → "CI Pipeline" → verificar próxima execução agendada

---

## 📖 Documentação de Conceitos Avançados

### Cache de Dependências
```yaml
- uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
```

**Por que?** Evita reinstalar 50+ pacotes do npm a cada execução. Se `package-lock.json` não mudou, reutiliza cache anterior (reduz tempo de ~15s para ~2s).

---

### Condicionalidade na Pipeline
```yaml
if: github.ref == 'refs/heads/main' && always()
```

**Significado:**
- `github.ref == 'refs/heads/main'`: Executa apenas se branch é `main`
- `always()`: Executa mesmo que testes falhem

**Caso de uso:** Deploy apenas de código validado (main), mas sempre tenta fazer upload de artifacts para auditoria.

---

### Permissões e Segurança
```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

**Princípio do Menor Privilégio:** Workflow recebe apenas permissões necessárias (não tudo).

---

## 🎓 Para Aprender Mais

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Mocha Testing Framework](https://mochajs.org/)
- [mochawesome Reporter](https://adamgruber.github.io/mochawesome/)
- [Cron Syntax Reference](https://crontab.guru/)
- [GitHub Pages](https://pages.github.com/)

---

## ✅ Checklist de Configuração

- [ ] `package.json` atualizado com mochawesome
- [ ] `npm install` executado localmente
- [ ] `.github/workflows/ci.yml` criado
- [ ] `.gitignore` atualizado com padrões de relatórios
- [ ] Código feito push para GitHub
- [ ] GitHub Actions executa com sucesso (visualizar em Actions tab)
- [ ] Artifacts aparecem após primeira execução
- [ ] GitHub Pages ativado em Settings → Pages
- [ ] Relatório HTML acessível em GitHub Pages (aguarde 2-3 min)
- [ ] README lido e conceitos entendidos ✓

---

**Status:** Pipeline de CI implementada com sucesso! 🚀

Próximas etapas recomendadas:
1. Faça um push para disparar primeira execução
2. Verifique Actions tab para status em tempo real
3. Compartilhe link de GitHub Pages com stakeholders
4. Configure notificações (opcional) em caso de falhas
