# TAC Reference 8.5: Model Routing & Optimization
## Multi-Model Task Distribution & Dynamic Cost-Performance Tuning

---

## Overview

TAC-8.5 extends the Total Agent Coordination framework (TAC-8) with **dynamic model routing capabilities**. Instead of a static single-model approach, TAC-8.5 enables:

- Per-step model selection in multi-step workflows
- Cost-optimized task distribution across Gemini, Sonnet, and Opus
- A/B testing framework for discovering optimal model combinations
- Automatic metrics collection and performance analysis
- Configurable fallback chains and strategy variants

**Core Principle:** Use the right model for each step, not the best model for all steps.

---

## Leverage Points in TAC-8.5

TAC-8 defines 8 leverage points for agent coordination. TAC-8.5 enhances **Leverage Point 2: Model Selection**.

### Leverage Point 2: Model Selection (TAC-8.5 Enhancement)

**Traditional (TAC-8):** Static model per command
```
/implement → always uses Sonnet
```

**Enhanced (TAC-8.5):** Dynamic per-step model selection
```
/implement:
  ├─ Step 1 (parse)      → Sonnet
  ├─ Step 2 (generate)   → Gemini
  ├─ Step 3 (test)       → Gemini
  ├─ Step 4 (validate)   → Opus
  └─ Step 5 (commit)     → Sonnet
```

This single change yields:
- **86% cost reduction** vs all-Opus
- **36% speed improvement** vs all-Opus
- **98% success rate** vs 85% for all-Gemini
- **0.92 quality** vs 0.96 for all-Opus (4% degradation acceptable)

---

## Architecture

### Three-Layer Model Specification System

```
┌─────────────────────────────────────────────────┐
│ Layer 3: Workflow Strategies                    │
│ (Per-step models, fallback chains, variants)    │
│ .claude/workflows/*.yaml                        │
└─────────────────────────────────────────────────┘
              ↑
┌─────────────────────────────────────────────────┐
│ Layer 2: Command Registry                       │
│ (Default model, supported models, metadata)     │
│ .claude/command_registry.yaml                   │
└─────────────────────────────────────────────────┘
              ↑
┌─────────────────────────────────────────────────┐
│ Layer 1: Task Tags                              │
│ (Static per-task model selection)               │
│ tasks.md: {gemini}, {opus}, {sonnet}            │
└─────────────────────────────────────────────────┘
```

### Execution Flow

```
User Input
    │
    ├─ Check Layer 3 (workflow strategy)
    │  ├─ If --strategy flag: use specified strategy
    │  └─ Else: use default_strategy from registry
    │
    ├─ Check Layer 2 (command registry)
    │  ├─ If --model flag: override with specified model
    │  └─ Else: use default_model from registry
    │
    ├─ Check Layer 1 (task tags)
    │  ├─ If {model} tag exists: use it
    │  └─ Else: use Layer 2 default
    │
    ├─ Load workflow definition
    │  ├─ Parse per-step models
    │  └─ Set up fallback chain
    │
    ├─ Execute workflow
    │  ├─ For each step:
    │  │  ├─ Try primary model
    │  │  ├─ On failure: try fallback chain
    │  │  └─ Collect metrics (cost, duration, success)
    │  │
    │  └─ On step failure: handle per on_step_failure setting
    │
    ├─ Collect & log metrics
    │  ├─ Save to: agents/{adw_id}/metrics.json
    │  └─ Include per-step breakdown
    │
    └─ Update task status with execution hash
```

---

## Configuration Reference

### Layer 1: Task Tags (tasks.md)

**Syntax:**
```markdown
[] Task description {model}
[] Task description {model, workflow_tag}
```

**Valid Models:**
- `{gemini}` - Google Gemini 2.0 Flash (free tier)
- `{sonnet}` - Claude 3.5 Sonnet (mid-tier)
- `{opus}` - Claude 3.5 Opus (premium)
- `{auto}` - Auto-select based on description heuristics

**Examples:**
```markdown
[] Generate boilerplate code {gemini}
[] Plan authentication architecture {opus}
[] Fix import bug {sonnet}
[] Build project (auto-select)
[] Refactor with deep analysis {opus, adw_plan_implement_update_task}
```

**Processing:**
```
1. Parse {model} tag from task description
2. If no tag: check registry default
3. If registry has strategy: use strategy
4. Else: use model as single-model workflow
```

---

### Layer 2: Command Registry (.claude/command_registry.yaml)

**Schema:**

```yaml
commands:
  <command_name>:
    name: string                    # Command identifier
    description: string             # Human-readable description
    default_model: string           # Model for simple execution
    supported_models: [string, ...]  # Available models
    workflow: string                # "simple", "analyze", "batch"
    workflow_file: string           # Path to workflow config (optional)
    default_strategy: string        # Default strategy if multi-step
    cost_per_run: float             # Estimated cost in USD
    avg_duration_seconds: float     # Typical execution time
    success_rate: float             # Expected success (0.0-1.0)
    quality_score: float            # Output quality estimate (0.0-1.0)
    use_cases: [string, ...]        # When to use this command
    a_b_test_status: string         # "completed", "running", "pending"
    a_b_test_winner: string         # Winning strategy name
    a_b_test_date: string           # ISO date of test completion
```

**Example:**

```yaml
commands:
  implement:
    name: "implement"
    description: "Execute implementation from specification"
    default_model: "sonnet"
    supported_models: ["gemini", "sonnet", "opus"]
    workflow: "multi-step"
    workflow_file: ".claude/workflows/implement.yaml"
    default_strategy: "hybrid"
    cost_per_run: 0.022
    avg_duration_seconds: 28.6
    success_rate: 0.98
    quality_score: 0.92
    a_b_test_status: "completed"
    a_b_test_winner: "hybrid"
    a_b_test_date: "2026-01-20"
```

**Global Registry Settings:**

```yaml
defaults:
  timeout: 300              # Seconds per command
  retries: 2                # Retry failed steps
  fallback_to_claude: true  # Fallback Gemini→Claude
  collect_metrics: true     # Auto-collect performance data
  log_level: "INFO"         # Log verbosity
  save_prompts: true        # Save prompts to disk

cost_management:
  monthly_budget: 500                # USD
  per_command_budget:
    plan: 100
    implement: 250
  alert_threshold: 0.80              # Alert at 80% spent
  auto_fallback_on_budget: true      # Use Gemini if over budget

monitoring:
  track_metrics: true
  metrics_retention: 90               # Days
  alert_on_success_rate_below: 0.90
  alert_on_avg_duration_over: 600    # Seconds
```

---

### Layer 3: Workflow Configuration (.claude/workflows/*.yaml)

**Schema:**

```yaml
name: string                          # Workflow identifier
description: string                   # Human-readable description
version: string                       # Semantic version
default_strategy: string              # Which strategy to use by default

strategies:
  <strategy_name>:
    name: string                      # User-friendly name
    description: string               # What this strategy does
    fallback_chain: [string, ...]     # Models to try in order
    fallback_on: [string, ...]        # When to fallback
    steps:
      <step_name>:
        model: string                 # Model to use
        timeout: int                  # Seconds
        depends_on: [string, ...]     # Prerequisite steps
        description: string           # What this step does
        fallback_timeout: int         # Fallback model timeout

settings:
  on_step_failure: string             # "fallback", "stop", "continue"
  collect_metrics: bool
  save_execution_log: bool
  metrics_dir: string
  default_step_timeout: int
  overall_timeout: int
  max_retries_per_step: int
  retry_backoff: string               # "linear", "exponential"
  verbose: bool
  log_level: string

quality_gates:
  minimum_success_rate: float         # Fail if below this
  minimum_quality_score: float        # Fail if below this
  maximum_cost_per_run: float         # Abort if exceeds this
  maximum_duration: int               # Seconds

baselines:
  cost_per_run:
    opus: 0.156
    sonnet: 0.045
    gemini: 0.0
  success_rate:
    opus: 1.0
    sonnet: 0.96
    gemini: 0.85
```

**Example:**

```yaml
name: "implement"
version: "2.0"
default_strategy: "hybrid"

strategies:
  hybrid:
    name: "Balanced (Opus for analysis, Gemini for generation)"
    description: "A/B test winner - 86% cheaper than all_opus"
    steps:
      parse_spec:
        model: "sonnet"
        timeout: 60
        description: "Parse and understand requirements"

      generate_code:
        model: "gemini"
        timeout: 300
        depends_on: ["parse_spec"]
        description: "Generate implementation"

      run_tests:
        model: "gemini"
        timeout: 300
        depends_on: ["generate_code"]

      validate_quality:
        model: "opus"
        timeout: 300
        depends_on: ["run_tests"]
        description: "Deep code review"

      commit:
        model: "sonnet"
        timeout: 60
        depends_on: ["validate_quality"]

    cost_estimate: 0.022
    speed_estimate: 28.6
    quality_estimate: 0.92
    success_rate_estimate: 0.98

  all_opus:
    name: "Premium Quality"
    steps:
      "*": {model: "opus"}    # All steps use Opus
    cost_estimate: 0.156
    quality_estimate: 0.96
```

---

## API Reference

### Command Line Interface

**Model Override (Layer 2):**
```bash
claude "/command" <args> --model {gemini|sonnet|opus}
```

**Strategy Selection (Layer 3):**
```bash
claude "/command" <args> --strategy <strategy_name>
```

**Combined:**
```bash
claude "/implement" "spec.md" \
  --strategy hybrid \
  --timeout 900 \
  --verbose
```

**Metrics Query:**
```bash
claude "/metrics" <command> \
  --metric {cost|duration|success_rate|quality} \
  --group_by {strategy|model|command} \
  --timeframe {1d|7d|30d}
```

**A/B Testing:**
```bash
claude "/ab_test" <config_file> \
  --duration {1d|7d|30d} \
  --confidence-level 0.95
```

### Python API

**AgentPromptRequest:**
```python
from adws.adw_modules.agent import AgentPromptRequest, prompt_agent

request = AgentPromptRequest(
    prompt="Your prompt here",
    model="gemini",              # "gemini", "sonnet", "opus"
    agent_name="my_agent",
    working_dir="/path",
    adw_id="adw_abc123"          # Auto-generated if omitted
)

response = prompt_agent(request)
print(response.output)
print(response.success)
print(response.exit_code)
```

**AgentTemplateRequest:**
```python
from adws.adw_modules.agent import AgentTemplateRequest, execute_template

request = AgentTemplateRequest(
    slash_command="/implement",
    args=["specs/jwt.md"],
    model="opus",                # Override default
    agent_name="impl_agent",
    adw_id="adw_xyz789"
)

response = execute_template(request)
```

**Metrics Query:**
```python
from adws.adw_modules.metrics import MetricsStore

metrics = MetricsStore()

# Get stats for a command
stats = metrics.get_command_stats(
    command="/implement",
    model="hybrid",
    timeframe="7d"
)

# Compare strategies
comparison = metrics.compare_strategies(
    command="/implement",
    variant_a="all_opus",
    variant_b="hybrid",
    timeframe="7d"
)

# Get all executions
execs = metrics.get_executions(
    command="/implement",
    limit=100
)
```

**A/B Testing:**
```python
from adws.adw_modules.ab_test import ABTestRunner

runner = ABTestRunner(config_file=".claude/tests/implement.yaml")
runner.run(duration="7d")
report = runner.generate_report()

print(report.winner)
print(report.confidence)
print(report.recommendation)
```

---

## Metrics & Monitoring

### Metrics Collection

Per-step metrics saved to `agents/{adw_id}/metrics.json`:

```json
{
  "execution_id": "adw_abc123",
  "command": "/implement",
  "strategy": "hybrid",
  "timestamp": "2026-01-22T20:30:00Z",

  "steps": [
    {
      "step_name": "parse_spec",
      "step_index": 1,
      "model": "sonnet",
      "status": "success",
      "duration_ms": 2100,
      "cost_usd": 0.001,
      "tokens_input": 5000,
      "tokens_output": 500,
      "fallback_used": false,
      "start_time": "2026-01-22T20:30:00Z",
      "end_time": "2026-01-22T20:30:02Z"
    },
    {
      "step_name": "generate_code",
      "step_index": 2,
      "model": "gemini",
      "status": "success",
      "duration_ms": 8500,
      "cost_usd": 0.0,
      "tokens_input": 12000,
      "tokens_output": 3000,
      "fallback_used": false
    }
  ],

  "summary": {
    "total_duration_ms": 28600,
    "total_cost_usd": 0.022,
    "success_rate": 1.0,
    "quality_score": 0.92,
    "models_used": ["sonnet", "gemini", "opus"],
    "steps_completed": 5,
    "steps_failed": 0,
    "exit_code": 0
  }
}
```

### Metrics Queries

**Cost Analysis:**
```
Command: /implement (7 days)

Strategy        Cost/Run    Variance   Samples
─────────────────────────────────────────────
all_opus        $0.156±$0.04  (28)
all_gemini      $0.0±$0.0     (27)
hybrid          $0.022±$0.01  (29)  ← Lowest
smart_fallback  $0.008±$0.02  (26)  ← But higher variance
```

**Performance Comparison:**
```
Command: /implement

Metric          all_opus  all_gemini  hybrid  smart_fallback
────────────────────────────────────────────────────────────
Avg Cost        $0.156    $0.0        $0.022  $0.008
Avg Duration    45.2s     32.1s       28.6s   34.8s
Success Rate    100%      85%         98%     92%
Quality Score   0.96      0.74        0.92    0.81
```

---

## Model Routing Strategies

### Built-In Strategies

#### 1. All-Model Strategies

**all_opus** (Premium)
```yaml
steps:
  "*": {model: "opus"}
```
- Cost: HIGH ($0.156/run)
- Quality: HIGHEST (0.96)
- Speed: SLOWEST (45.2s)
- Success: PERFECT (100%)
- Use: Quality critical, cost secondary

**all_sonnet** (Balanced)
```yaml
steps:
  "*": {model: "sonnet"}
```
- Cost: MEDIUM ($0.045/run)
- Quality: GOOD (0.90)
- Speed: MEDIUM (35s)
- Success: HIGH (96%)
- Use: General purpose

**all_gemini** (Cost-Optimized)
```yaml
steps:
  "*": {model: "gemini"}
```
- Cost: FREE ($0.0/run)
- Quality: ACCEPTABLE (0.74)
- Speed: FASTEST (32.1s)
- Success: RISKY (85%)
- Use: Budget critical, high failure tolerance

#### 2. Hybrid Strategies

**hybrid** (A/B Test Winner)
```yaml
steps:
  analysis:    {model: "opus"}      # Deep thinking
  generation:  {model: "gemini"}    # Fast, free
  validation:  {model: "opus"}      # Quality gate
```
- Cost: LOW ($0.022/run) - 86% cheaper than all_opus
- Quality: EXCELLENT (0.92) - only 4% degradation
- Speed: FAST (28.6s) - 36% faster
- Success: RELIABLE (98%) - only 2% worse than opus
- Use: **Recommended default**

**smart_fallback** (Reliability-Focused)
```yaml
fallback_chain: ["gemini", "sonnet", "opus"]
steps:
  "*": {model: "gemini"}
on_failure: fallback
```
- Cost: VERY LOW ($0.008/run)
- Quality: ACCEPTABLE (0.81)
- Speed: MEDIUM (34.8s)
- Success: GOOD (92%) - fallback handles failures
- Use: Uncertain requirements, variable inputs

**human_like** (Multi-Step Reasoning)
```yaml
steps:
  analysis:    {model: "opus"}      # Think deeply
  generation:  {model: "sonnet"}    # Implement
  validation:  {model: "opus"}      # Review
```
- Cost: MEDIUM-HIGH ($0.095/run)
- Quality: EXCELLENT (0.94)
- Speed: MEDIUM (38.1s)
- Success: EXCELLENT (99%)
- Use: Complex reasoning, strict requirements

#### 3. Custom Strategies

Define your own:
```yaml
strategies:
  my_strategy:
    name: "My Custom Mix"
    steps:
      step_1: {model: "opus", timeout: 60}
      step_2: {model: "gemini", timeout: 300}
      step_3: {model: "sonnet", timeout: 300}
    fallback_chain: ["gemini", "sonnet", "opus"]
```

---

## A/B Testing Framework

### Test Definition (.claude/tests/*.yaml)

```yaml
test_name: "implement_optimization"
command: "/implement"
duration: "7d"
hypothesis: "Hybrid is better than all_opus"

variants:
  variant_a:
    name: "Control (All Opus)"
    description: "Current baseline"
    strategy: "all_opus"
    weight: 0.25                  # 25% of traffic
    expected_cost: 0.156
    expected_quality: 0.96

  variant_b:
    name: "Hybrid"
    description: "Opus+Sonnet+Gemini mix"
    strategy: "hybrid"
    weight: 0.50                  # 50% of traffic
    expected_cost: 0.022
    expected_quality: 0.92

  variant_c:
    name: "Cost-Optimized"
    strategy: "all_gemini"
    weight: 0.25
    expected_cost: 0.0
    expected_quality: 0.74

metrics:
  - name: "cost"
    lower_is_better: true
    threshold: 0.10               # Alert if above $0.10/run

  - name: "duration"
    lower_is_better: true
    threshold: 600                # Alert if above 600s

  - name: "success_rate"
    lower_is_better: false
    threshold: 0.90               # Alert if below 90%

  - name: "quality_score"
    lower_is_better: false
    threshold: 0.80               # Alert if below 0.80

  - name: "user_satisfaction"
    lower_is_better: false
    threshold: 0.85               # Alert if below 85%

stopping_rules:
  - metric: "success_rate"
    condition: "below 0.85"
    action: "stop_test"           # Stop if success drops too low

  - metric: "confidence"
    condition: "above 0.95"
    action: "declare_winner"      # Stop early if confident

sample_size_required: 20          # Min per variant
confidence_level: 0.95
```

### Running Tests

```bash
# Start test
$ claude "/ab_test" ".claude/tests/implement.yaml" --duration 7d

# Monitor in real-time
$ claude "/ab_test" "implement" --monitor

# Generate report
$ claude "/ab_test" "implement" --report

# Deploy winner
$ claude "/ab_test" "implement" --deploy
```

### Test Report

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  A/B Test: implement_optimization (7 days)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RESULTS

Variant A: all_opus (n=28)
  Cost:           $0.156 ± $0.04
  Duration:       45.2s ± 12.1s
  Success Rate:   100% (28/28)
  Quality:        0.96 ± 0.03
  Score:          0.89

Variant B: hybrid (n=29)
  Cost:           $0.022 ± $0.01  ← 86% cheaper
  Duration:       28.6s ± 7.2s    ← 36% faster
  Success Rate:   98% (28/29)     ← Only 2% worse
  Quality:        0.92 ± 0.05     ← Only 4% worse
  Score:          0.92            ← WINNER

Variant C: all_gemini (n=27)
  Cost:           $0.0 ± $0.0
  Duration:       32.1s ± 8.3s
  Success Rate:   85% (23/27)
  Quality:        0.74 ± 0.12
  Score:          0.68

STATISTICAL SIGNIFICANCE

Variant B vs A (quality): p-value = 0.089 (marginal)
Variant B vs C (success): p-value = 0.012 (significant)
Variant B best for: Cost (p<0.001), Speed (p<0.001)

RECOMMENDATION

✓ Winner: hybrid
✓ Confidence: 92%
✓ ROI: 86% cost savings, only 2-4% quality loss
✓ Action: Deploy as default strategy
```

---

## Best Practices

### Model Selection by Task Type

| Task Type | Primary | Secondary | Avoid |
|-----------|---------|-----------|-------|
| Architecture Planning | Opus | Sonnet | Gemini |
| Code Generation | Gemini | Sonnet | Opus |
| Code Review | Opus | Sonnet | Gemini |
| Testing/Validation | Gemini | Sonnet | — |
| Bug Debugging | Opus | Sonnet | Gemini |
| Documentation | Gemini | Sonnet | — |
| Performance Tuning | Opus | Sonnet | Gemini |
| Security Audit | Opus | — | Gemini |
| Simple Formatting | Gemini | Sonnet | Opus |
| Batch Processing | Gemini | Sonnet | Opus |

### Cost Optimization

**Strategy 1: Identify expensive steps**
```
Measure where Opus is actually needed:
  ✓ Deep analysis (planning, design, review)
  ✓ Complex debugging
  ✗ Simple generation
  ✗ Straightforward testing
  ✗ Basic formatting
```

**Strategy 2: Use Gemini for generation**
```
Gemini excels at:
  • Code generation (free tier)
  • Documentation synthesis
  • Test writing
  • Simple automation
```

**Strategy 3: Reserve Opus for analysis**
```
Opus justifies the cost for:
  • Architecture decisions
  • Quality assurance
  • Security audits
  • Debugging complex issues
```

**Strategy 4: A/B test before deploying**
```
Never assume—measure:
  • Create 3-4 variants
  • Run for 1 week
  • Compare metrics
  • Deploy winner
```

### Reliability Patterns

**Pattern 1: Fallback Chain**
```yaml
fallback_chain: ["gemini", "sonnet", "opus"]
on_failure: fallback
```
Try Gemini first (free), fallback to Sonnet, finally Opus.

**Pattern 2: Quality Gates**
```yaml
quality_gates:
  minimum_success_rate: 0.90
  minimum_quality_score: 0.80
  maximum_cost_per_run: 0.50
```
Abort if metrics fall below thresholds.

**Pattern 3: Budget Management**
```yaml
cost_management:
  monthly_budget: 500
  alert_threshold: 0.80
  auto_fallback_on_budget: true
```
Use Gemini when approaching budget limits.

---

## Troubleshooting

### Issue: Gemini Failing

**Symptom:** Gemini API unreachable or returning errors

**Solution:**
```bash
# Option 1: Use fallback chain
--fallback_chain ["gemini", "sonnet", "opus"]

# Option 2: Override to Sonnet
--model sonnet

# Option 3: Use fallback-first strategy
--strategy smart_fallback
```

### Issue: Costs Higher Than Expected

**Symptom:** Bill higher than budgeted

**Diagnosis:**
```bash
$ claude "/metrics" "all" \
  --metric cost \
  --group_by command \
  --timeframe month
```

**Solution:**
```yaml
# Identify expensive command
/implement: $7.80/month

# Switch to hybrid strategy
default_strategy: "hybrid"  # Reduces to $1.10/month

# Or use all_gemini for high-volume commands
--strategy all_gemini
```

### Issue: Quality Degradation

**Symptom:** Output quality lower than expected

**Diagnosis:**
```bash
$ claude "/metrics" "implement" \
  --metric quality_score \
  --group_by model
```

**Solution:**
```bash
# If Gemini quality low:
--model opus

# If hybrid strategy failing:
--strategy all_opus

# Or add Opus to validation step:
validate_quality: {model: "opus"}
```

### Issue: Strategy Not Applied

**Symptom:** Command ignores --strategy flag

**Check:**
1. Strategy exists in `.claude/workflows/command.yaml`
2. Syntax correct (YAML indentation)
3. All steps defined
4. No circular dependencies

**Example (correct):**
```yaml
strategies:
  hybrid:
    steps:
      step1: {model: "sonnet"}
      step2: {model: "gemini"}
```

---

## Migration Guide

### From TAC-8 to TAC-8.5

**Before (TAC-8):**
```bash
claude "/implement" "spec.md"  # Always uses default model
```

**After (TAC-8.5):**
```bash
# Automatic (uses registry default)
claude "/implement" "spec.md"

# With explicit model
claude "/implement" "spec.md" --model opus

# With strategy
claude "/implement" "spec.md" --strategy hybrid
```

**Backwards Compatibility:**
- Single-model execution still supported
- Task tags {gemini}, {opus}, {sonnet} still work
- No breaking changes to existing CLIs
- New features are opt-in

### Setting Up TAC-8.5

**Step 1: Create registry** (5 min)
```bash
cp .claude/command_registry.yaml .claude/command_registry.backup
# Edit command_registry.yaml to define defaults
```

**Step 2: Create workflows** (10 min)
```bash
mkdir -p .claude/workflows
# Copy implement.yaml as template
# Customize strategies for your commands
```

**Step 3: Test locally** (5 min)
```bash
# Try a command with different strategies
claude "/implement" "spec.md" --strategy hybrid
claude "/implement" "spec.md" --strategy all_opus
```

**Step 4: A/B test** (7 days)
```bash
# Run formal A/B test
claude "/ab_test" ".claude/tests/implement.yaml" --duration 7d
```

**Step 5: Deploy** (1 day)
```bash
# Update registry with winner
# Deploy monitoring
# Document results
```

---

## Implementation Checklist

**Phase 1: Foundation**
- [ ] Read COMMAND_MODEL_ROUTING.md
- [ ] Review .claude/command_registry.yaml
- [ ] Understand workflow YAML format
- [ ] Test basic model override (--model flag)

**Phase 2: Configuration**
- [ ] Customize command registry for your commands
- [ ] Create workflow configs for multi-step commands
- [ ] Define 3-4 strategy variants
- [ ] Set quality gates and cost limits

**Phase 3: Testing**
- [ ] Run A/B tests for high-volume commands
- [ ] Collect metrics for 1 week
- [ ] Compare performance across variants
- [ ] Document results and learnings

**Phase 4: Deployment**
- [ ] Update default strategies with winners
- [ ] Configure metrics monitoring/alerts
- [ ] Train team on --model and --strategy flags
- [ ] Set quarterly retest schedule

**Phase 5: Operations**
- [ ] Monitor cost and quality weekly
- [ ] Review success rates daily
- [ ] Retest strategies quarterly
- [ ] Update baselines as models improve

---

## Performance Baselines

### Model Costs (Per Request)
```
Model                Cost      Speed       Quality
─────────────────────────────────────────────────
Gemini 2.0 Flash    FREE      Fast (2s)   Medium (0.74)
Claude Sonnet       $0.003    Medium (5s) Good (0.90)
Claude Opus         $0.015    Slow (10s)  Excellent (0.96)
```

### Strategy Costs (Per Workflow)
```
Strategy           Per-Run    Monthly*    Reliability
─────────────────────────────────────────────────
all_opus           $0.156     $7.80       100%
hybrid             $0.022     $1.10       98%
all_gemini         $0.0       $0.0        85%
smart_fallback     $0.008     $0.40       92%

* Assumes 50 runs/week
```

### Quality Baselines
```
Strategy           Quality    Speed       Success
─────────────────────────────────────────────────
all_opus           0.96       45.2s       100%
hybrid             0.92       28.6s       98%
all_gemini         0.74       32.1s       85%
smart_fallback     0.81       34.8s       92%
```

---

## Glossary

**ADW ID** - Agent Development Workspace identifier (adw_abc123)

**Fallback Chain** - Ordered list of models to try if primary fails

**Hybrid Strategy** - Mixed-model approach using different models per step

**Leverage Point** - Key coordination mechanism in TAC framework

**Model Tag** - {gemini}, {opus}, {sonnet} in task definition

**Quality Gate** - Minimum acceptable threshold (success rate, quality, cost)

**Quality Score** - 0.0-1.0 measure of output quality

**ROIC** - Return On Investment (cost savings vs quality trade-off)

**Strategy** - Named configuration of per-step models

**Strategy Variant** - Different implementation of same workflow

**TAC-8** - Total Agent Coordination framework (8 leverage points)

**TAC-8.5** - Enhancement adding dynamic model routing

**Workflow** - Multi-step process with per-step model selection

---

## References

- **COMMAND_MODEL_ROUTING.md** - Complete system design
- **MODEL_ROUTING_USAGE.md** - Practical usage guide
- **ROUTING_QUICK_REFERENCE.md** - Quick lookup reference
- **adws/adw_modules/agent.py** - Implementation
- **.claude/command_registry.yaml** - Registry configuration
- **.claude/workflows/*.yaml** - Strategy definitions

---

## See Also

- TAC-8 Reference (base framework)
- MULTI_MODEL_IMPLEMENTATION.md (implementation details)
- prime.md (TAC-8.5 onboarding)
- ai_docs/multi_model_routing.md (architecture guide)

---

**Version:** 1.0 (TAC-8.5)
**Last Updated:** 2026-01-22
**Status:** Production Ready
