# em-control-tower — Vision

## Why this project exists

The way engineering teams work has fundamentally changed. AI now generates a significant share of the code we ship. As an Engineering Manager, the skills I need to develop in my team have shifted: **the ability to critically review, challenge, and improve AI-generated code is becoming as important as writing code from scratch.**

This project is a personal assistant that helps me lead my team through this transition by applying the principles of **Radical Candor** — caring personally while challenging directly — backed by data rather than gut feeling.

---

## Core philosophy

> Give feedback that is specific, timely, and grounded in observable facts.

em-control-tower aggregates signals from the tools my team already uses (GitHub, Slack, Confluence, Jira) so that every 1:1 conversation I have is informed, fair, and actionable.

---

## Feature areas

### 1. Delivery tracking

Understand the team's throughput and how AI is reshaping it.

| Metric | Description |
|--------|-------------|
| **PR count** | Number of PRs opened per person over a period |
| **PR size** | Lines of code added/removed per PR |
| **AI vs. human authorship** | Ratio of AI-generated PRs to manually written PRs |

Goals:
- Spot bottlenecks and imbalances in workload distribution.
- Understand how AI adoption evolves across the team over time.

### 2. Review quality analysis (primary focus)

This is the heart of the project. In an AI-heavy workflow, **review quality is the strongest signal of engineering maturity**.

#### 2.1 PR comment categorization

Classify every review comment into categories such as:

- **Bug / correctness** — catches a real defect
- **Security** — identifies a vulnerability or unsafe pattern
- **Performance** — highlights an inefficiency
- **Readability / maintainability** — improves long-term code health
- **Nitpick / style** — minor formatting or naming preference
- **Architecture / design** — questions or improves structural decisions
- **Missing test / coverage** — asks for better testing
- **Question / clarification** — seeks understanding without requesting a change

#### 2.2 Seniority signal detection

Derive a per-person, per-language seniority profile based on review behavior:

- Depth of comments (surface-level vs. architectural)
- Ability to spot issues that AI missed
- Frequency and quality of suggested code changes
- Consistency of review quality across different repositories and languages

#### 2.3 Highlight reel

For each team member, surface:

- **Best comments** — strong examples to celebrate and reinforce (Radical Candor: praise specifically)
- **Growth opportunities** — comments where they could have gone deeper or caught more, with concrete suggestions (Radical Candor: challenge directly)

### 3. Team interaction insights (future)

Expand beyond code to understand how team members collaborate and communicate.

| Source | Signals |
|--------|---------|
| **Slack** | Message frequency, channels participated in, response times, tone/sentiment |
| **Confluence** | Pages created or edited, documentation contributions |
| **Jira** | Comment activity, cross-team interactions |

Goal: surface positive interactions I may not have witnessed so I can acknowledge them, and detect patterns (isolation, frustration, disengagement) early enough to act.

### 4. OKR-to-individual-goals engine (future)

Help me translate quarterly team OKRs into personalized, SMART goals for each team member.

Flow:
1. Input my quarterly OKRs.
2. The system considers each person's detected seniority level, current strengths, and growth areas.
3. It proposes a set of challenging but achievable individual goals aligned to the OKRs.
4. Goals follow the SMART framework: Specific, Measurable, Achievable, Relevant, Time-bound.

This ensures that junior and senior engineers are challenged appropriately — not held to the same bar, but each pushed to grow from where they are.

---

## Guiding principles

1. **Data informs, humans decide.** The tool surfaces signals; I own the judgment and the conversation.
2. **Radical Candor over radical surveillance.** The goal is growth, not control. Data is used to give better feedback, never to punish.
3. **Privacy by default.** Mood and interaction tracking must be opt-in and transparent to the team.
4. **Start small, iterate.** Ship the delivery and review analysis first; expand to interaction and OKR features only once the foundation is solid.

---

## Roadmap sketch

| Phase | Scope | Status |
|-------|-------|--------|
| **Phase 0** | Project setup, vision, architecture decisions | Current |
| **Phase 1** | GitHub integration — PR metrics and review comment extraction | Planned |
| **Phase 2** | Comment categorization and seniority profiling | Planned |
| **Phase 3** | Highlight reel and 1:1 preparation dashboard | Planned |
| **Phase 4** | Slack & Confluence integration | Future |
| **Phase 5** | OKR-to-goals engine | Future |
