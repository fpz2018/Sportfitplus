# Top 20 Claude Skills op GitHub

Overzicht van populaire en nuttige Claude (Code) Skills en skill-collecties op GitHub, inclusief waarvoor je ze kunt gebruiken. Sterren zijn indicatief en veranderen snel.

## Officieel / Anthropic

1. **[anthropics/skills](https://github.com/anthropics/skills)** — Officiële Anthropic Agent Skills repo.
   *Wat kun je ermee:* PDF/Office-documenten lezen en genereren, webapps testen, Artifacts bouwen, nieuwe skills scaffolden, MCP-servers opzetten. Startpunt voor alles.

2. **[anthropics/claude-code](https://github.com/anthropics/claude-code)** — De CLI zelf.
   *Wat kun je ermee:* Referentie-implementatie, voorbeelden van hooks/slash commands, bug-reports. Handig om te zien hoe skills geladen worden.

## Curated lijsten (vind snel de juiste skill)

3. **[hesreallyhim/awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code)** — Meest gebruikte index.
   *Wat kun je ermee:* Ontdekken van skills, hooks, slash-commands, agent-orchestrators en plugins.

4. **[VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills)** — 1000+ skills van officiële dev-teams (Vercel, Stripe, Cloudflare, Netlify, Sentry, Figma, Hugging Face).
   *Wat kun je ermee:* Skills vinden voor specifieke SaaS-stacks — relevant voor Sportfit Plus (Netlify, Supabase-achtige integraties).

5. **[ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills)** — Per workflow-type georganiseerd.
   *Wat kun je ermee:* Snel een skill kiezen op basis van taak (data, devops, content, etc.).

6. **[karanb192/awesome-claude-skills](https://github.com/karanb192/awesome-claude-skills)** — 50+ geverifieerde skills.
   *Wat kun je ermee:* "Safe list" — alleen skills die getest en onderhouden zijn.

7. **[travisvn/awesome-claude-skills](https://github.com/travisvn/awesome-claude-skills)** — Alternatieve curated lijst.
   *Wat kun je ermee:* Inspiratie voor customizing Claude workflows.

8. **[webfuse-com/awesome-claude](https://github.com/webfuse-com/awesome-claude)** — Brede Anthropic-lijst.
   *Wat kun je ermee:* Overzicht van tools, libraries, research en community-projecten rond Claude.

## Frameworks / skill-pakketten

9. **obra/superpowers** — 20+ battle-tested skills.
   *Wat kun je ermee:* TDD-workflow, systematisch debuggen, `/brainstorm`, `/write-plan`, `/execute-plan` — handig voor grotere features in Sportfit Plus (bv. weekmenu-generatie).

10. **SuperClaude-Org/SuperClaude** (~20k ⭐)
    *Wat kun je ermee:* Pre-configured personas (architect, reviewer, tester), gespecialiseerde commands en methodologies. Direct productiever zonder zelf prompts te schrijven.

11. **musistudio/claude-code-router** (~25k ⭐)
    *Wat kun je ermee:* Claude Code routeren naar verschillende modellen/endpoints, bv. Opus voor planning en Haiku voor uitvoering — scheelt kosten.

12. **MiniMax-AI/skills** — Dev-skills voor AI coding agents.
    *Wat kun je ermee:* Extra coding-capabilities (refactoring, code-review, generatie) bovenop Claude Code.

13. **abubakarsiddik31/claude-skills-collection** — Officieel + community.
    *Wat kun je ermee:* Modulaire skills voor productivity, coding, creativity — goed startpakket.

## Domein-specifieke skills

14. **Anthropic-Cybersecurity-Skills** — 753+ cybersecurity skills.
    *Wat kun je ermee:* Secure code review, vulnerability scanning, threat modeling — voor een fitness-app met user-data (Supabase auth, premium) waardevol bij audits.

15. **marketingskills** — CRO, copywriting, SEO, analytics, growth.
    *Wat kun je ermee:* Landingspagina's optimaliseren, e-mails schrijven, SEO van publieke pagina's (Landing, Nieuws, Gids) verbeteren.

16. **dev-browser** — Browser voor je agent.
    *Wat kun je ermee:* Claude echte webpagina's laten bezoeken — scraping, UI-testen, concurrentie-onderzoek.

17. **pdf / docx / xlsx / pptx** (uit `anthropics/skills`) — Documentverwerking.
    *Wat kun je ermee:* Trainingsschema's exporteren naar PDF, voedingsrapporten als Excel, labresultaten uit PDF inlezen voor KennisMonitor.

18. **webapp-testing** (uit `anthropics/skills`) — Playwright-based.
    *Wat kun je ermee:* End-to-end tests voor Dashboard, Voeding, Weekmenu, Onboarding — regressies vangen voor je ze live zet.

19. **skill-creator** (uit `anthropics/skills`) — Meta-skill.
    *Wat kun je ermee:* Zelf nieuwe skills genereren die passen bij dit project (bv. een `sportfit-recept-import` skill op basis van `fetchReceptenFromSheet.js`).

20. **mcp-builder** (uit `anthropics/skills`) — MCP-servers bouwen.
    *Wat kun je ermee:* Claude direct laten praten met Supabase, Netlify Functions of PubMed — minder glue-code, snellere iteratie op AI-features.
