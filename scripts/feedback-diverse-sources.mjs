/** Authoritative source catalog for feedback-plane example description upgrades. */

export const SOURCE_IDS = [
  'instructgpt',
  'dpo',
  'self_refine',
  'reflexion',
  'constitutional_ai',
  'chatbot_arena',
  'agentbench',
  'swe_bench',
  'openai_evals',
  'ragas',
  'braintrust',
  'wandb',
  'dspy_optimizers',
];

function kindMap(positive, boundary, counterexample, instance) {
  return ({ nodeId, kind }) => {
    const base = { positive, boundary, counterexample, instance };
    return base[kind] || base.positive;
  };
}

export const SOURCE_TEMPLATES = {
  instructgpt: kindMap(
    {
      zh: `InstructGPT (Ouyang et al., 2022) 三阶段 RLHF：SFT → 人类对同一 prompt 多输出排序训练 reward model r_θ(x,y) → PPO 优化策略；约 13k demonstration + 33k comparison 对；${nodeId} 映射 supervised/preference 数据准备边界，非 PPO 执行本身。`,
      en: `InstructGPT (Ouyang et al., 2022) three-stage RLHF: SFT → human rank outputs per prompt to train reward model r_θ(x,y) → PPO policy optimization; ~13k demos + 33k comparisons; ${nodeId} maps supervised/preference data-prep boundary, not PPO execution.`,
      ja: `InstructGPT (Ouyang et al., 2022) SFT→RM→PPO；約13k demo+33k comparison；${nodeId} はデータ準備境界。`,
    },
    {
      zh: `InstructGPT 比较数据用于 RM 训练，PPO 用 RM 分数作奖励；${nodeId} 记录数据实体，不能把 RewardModelScore 推断输出或 Verdict 混为训练信号。`,
      en: `InstructGPT comparison data trains RM; PPO uses RM scores as reward; ${nodeId} records data entities—do not mix RewardModelScore inference or Verdict as training signal.`,
      ja: `InstructGPT 比較データは RM 訓練用；${nodeId} は RewardModelScore/Verdict と混同不可。`,
    },
    {
      zh: `仅 contractor 原始 demonstration 文本、无 dataset_ref/transformation_policy_ref 的记录不能作为 InstructGPT 式 ${nodeId}；缺少 SFT 数据集边界应拒绝。`,
      en: `Raw contractor demonstration text without dataset_ref/transformation_policy_ref cannot serve as InstructGPT-style ${nodeId}; missing SFT dataset boundary should be rejected.`,
      ja: `dataset_ref なし生 demonstration は InstructGPT 式 ${nodeId} として拒否。`,
    },
    {
      zh: `InstructGPT 实例：prompt="Explain moon orbits" → contractor demonstration → dataset:instructgpt-sft-13k → learning_objective=supervised 映射 ${nodeId}。`,
      en: `InstructGPT instance: prompt → contractor demonstration → dataset:instructgpt-sft-13k → learning_objective=supervised maps to ${nodeId}.`,
      ja: `InstructGPT 实例 demonstration→dataset が ${nodeId} に写像。`,
    },
  ),
  dpo: kindMap(
    {
      zh: `DPO (Rafailov et al., 2023) 跳过显式 reward model，直接从偏好对优化：L_DPO = -E[log σ(β·(log π(y_w|x)/π_ref(y_w|x) - log π(y_l|x)/π_ref(y_l|x)))]；TRL DPOTrainer 用 prompt/chosen/rejected 字段；${nodeId} 保存授权偏好记录而非训练批次。`,
      en: `DPO (Rafailov et al., 2023) skips explicit RM, optimizes from preference pairs: L_DPO = -E[log σ(β·(log π(y_w|x)/π_ref(y_w|x) - log π(y_l|x)/π_ref(y_l|x)))]; TRL DPOTrainer uses prompt/chosen/rejected; ${nodeId} retains authorized preference records not training batches.`,
      ja: `DPO (Rafailov et al., 2023) L_DPO 損失；prompt/chosen/rejected；${nodeId} は訓練バッチではない。`,
    },
    {
      zh: `DPO 偏好对与 InstructGPT RM 比较数据格式相近但优化路径不同；${nodeId} 须标明 learning_objective=preference，不能把 1–5 Score 自动改写为 chosen/rejected。`,
      en: `DPO pairs resemble InstructGPT RM comparisons but optimize differently; ${nodeId} must state learning_objective=preference—cannot auto-convert 1–5 Score to chosen/rejected.`,
      ja: `DPO は preference 目的を明示；Score を chosen/rejected に自動変換不可。`,
    },
    {
      zh: `只有 chosen 无 rejected（或反之）的点击日志不能作为 DPO 式 ${nodeId} PreferenceExample。`,
      en: `Click logs with chosen only and no rejected (or vice versa) cannot serve as DPO-style ${nodeId} PreferenceExample.`,
      ja: `chosen/rejected 欠落クリックログは DPO 式 ${nodeId} として拒否。`,
    },
    {
      zh: `DPO 实例：prompt/chosen/rejected 三元组经 policy:training-consent-v1 清洗 → dataset_ref=dataset:help-dpo-v2 → 映射 ${nodeId}。`,
      en: `DPO instance: prompt/chosen/rejected triple cleaned by policy:training-consent-v1 → dataset_ref=dataset:help-dpo-v2 → maps to ${nodeId}.`,
      ja: `DPO 实例 prompt/chosen/rejected が ${nodeId} に写像。`,
    },
  ),
  self_refine: kindMap(
    {
      zh: `Self-Refine (Madaan et al., 2023) Generate→Feedback→Refine 迭代：LLM 生成初稿 → 同一 LLM 自我批评 → 改进输出，无需外部训练；${nodeId} 映射反馈驱动的修订产物，不是 RLHF 训练信号。`,
      en: `Self-Refine (Madaan et al., 2023) Generate→Feedback→Refine loop: LLM draft → same LLM self-critique → improved output without external training; ${nodeId} maps feedback-driven revision artifacts, not RLHF training signals.`,
      ja: `Self-Refine Generate→Feedback→Refine；${nodeId} は改訂成果物。`,
    },
    {
      zh: `Self-Refine 反馈是运行时自我批评文本；${nodeId} 规范身份与 Feedback 事件应分离，不能把 EvaluationRun 的 Verdict 直接当 refine 指令。`,
      en: `Self-Refine feedback is runtime self-critique text; separate ${nodeId} spec identity from Feedback events—EvaluationRun Verdict is not a refine instruction.`,
      ja: `Self-Refine feedback は runtime テキスト；Verdict と混同不可。`,
    },
    {
      zh: `单次生成无 Feedback 轮次的输出不能作为 Self-Refine 式 ${nodeId} 修订链。`,
      en: `Single generation without Feedback round cannot serve as Self-Refine-style ${nodeId} revision chain.`,
      ja: `Feedback なし単一生成は Self-Refine 式 ${nodeId} ではない。`,
    },
    {
      zh: `Self-Refine 实例：draft_v1 → feedback="缺少步骤编号" → revision_v2 → 映射 ${nodeId} RevisionArtifact。`,
      en: `Self-Refine instance: draft_v1 → feedback="missing step numbers" → revision_v2 → maps to ${nodeId} RevisionArtifact.`,
      ja: `Self-Refine 实例 draft→feedback→revision が ${nodeId} に写像。`,
    },
  ),
  reflexion: kindMap(
    {
      zh: `Reflexion (Shinn et al., 2023) 执行失败后 verbal reinforcement：self_reflection = reflect(trajectory, task_description) → memory.append(self_reflection) → 重试；AlfWorld 上 verbal feedback 提升成功率；${nodeId} 映射反思型 LearningSignal/Feedback。`,
      en: `Reflexion (Shinn et al., 2023) after failure: self_reflection = reflect(trajectory, task_description) → memory.append(self_reflection) → retry; verbal feedback improves AlfWorld success; ${nodeId} maps reflection-style LearningSignal/Feedback.`,
      ja: `Reflexion reflect(trajectory)→memory.append→retry；${nodeId} は反思信号。`,
    },
    {
      zh: `Reflexion verbal reflection 存入 episodic memory，不是 RewardModelScore；${nodeId} 与 EvaluationRun 的自动化 Score 应区分。`,
      en: `Reflexion verbal reflection goes to episodic memory, not RewardModelScore; distinguish ${nodeId} from EvaluationRun automated Score.`,
      ja: `Reflexion reflection は memory 用；Score と混同不可。`,
    },
    {
      zh: `失败后直接 retry 无 reflect(trajectory) 生成文字反思的路径不是 Reflexion 式 ${nodeId}。`,
      en: `Retry after failure without reflect(trajectory) verbal reflection is not Reflexion-style ${nodeId}.`,
      ja: `reflect なし retry は Reflexion 式 ${nodeId} ではない。`,
    },
    {
      zh: `Reflexion 实例：attempt_1 failed → reflect("应先读 API 文档") → attempt_2 → 映射 ${nodeId} Feedback mode=reflection。`,
      en: `Reflexion instance: attempt_1 failed → reflect("should read API docs first") → attempt_2 → maps to ${nodeId} Feedback mode=reflection.`,
      ja: `Reflexion 实例 failed→reflect→retry が ${nodeId} に写像。`,
    },
  ),
  constitutional_ai: kindMap(
    {
      zh: `Constitutional AI (Bai et al., 2022, Anthropic) RLAIF：模型按宪法原则 self-critique/revise → AI 偏好对训练 → 减少有害输出；${nodeId} 映射原则驱动的 Rubric/Feedback，非原始人类标注。`,
      en: `Constitutional AI (Bai et al., 2022, Anthropic) RLAIF: model self-critique/revise per constitutional principles → AI preference pairs for training → reduced harm; ${nodeId} maps principle-driven Rubric/Feedback, not raw human labels.`,
      ja: `Constitutional AI RLAIF self-critique→AI 選好；${nodeId} は原則 Rubric。`,
    },
    {
      zh: `CAI 宪法原则是 Rubric 规范内容；运行时 revision 文本是 Feedback 事件；${nodeId} 规约与 RLAIF 训练活动应分离。`,
      en: `CAI constitutional principles are Rubric spec content; runtime revision text is Feedback event; separate ${nodeId} spec from RLAIF training activity.`,
      ja: `CAI 原則は Rubric spec；revision テキストは Feedback イベント。`,
    },
    {
      zh: `无宪法原则引用、仅"请更安全"模糊提示的评分不能作为 Constitutional AI 式 ${nodeId} Rubric。`,
      en: `Vague "be safer" prompts without constitutional principle references cannot serve as Constitutional AI-style ${nodeId} Rubric.`,
      ja: `原則参照なし曖昧プロンプトは CAI 式 ${nodeId} ではない。`,
    },
    {
      zh: `CAI 实例：principle="Choose most harmless response" → self-critique → revised output → 映射 ${nodeId} HumanFeedback origin_kind=ai-assisted。`,
      en: `CAI instance: principle → self-critique → revised output → maps to ${nodeId} HumanFeedback origin_kind=ai-assisted.`,
      ja: `CAI 实例 principle→critique→revision が ${nodeId} に写像。`,
    },
  ),
  chatbot_arena: kindMap(
    {
      zh: `LMSYS Chatbot Arena (Zheng et al., 2023)：MT-Bench 80 道多轮题 GPT-4 judge 1–10 分；Arena 众包 pairwise A/B 对比 + Elo rating 排名；${nodeId} 映射 EvaluationRun/Score/Verdict 的众包评判证据。`,
      en: `LMSYS Chatbot Arena (Zheng et al., 2023): MT-Bench 80 multi-turn items with GPT-4 judge 1–10; Arena crowdsourced pairwise A/B + Elo ratings; ${nodeId} maps EvaluationRun/Score/Verdict crowdsourced judgment evidence.`,
      ja: `Chatbot Arena MT-Bench 1–10 + pairwise Elo；${nodeId} は評価証拠。`,
    },
    {
      zh: `MT-Bench Score 是 judge 输出；Rubric 是量规定义；${nodeId} 记录一次评判结果，不能把 Elo 排名表当作单次 Verdict。`,
      en: `MT-Bench Score is judge output; Rubric is scale definition; ${nodeId} records one judgment—Elo leaderboard is not a single Verdict.`,
      ja: `MT-Bench Score は judge 出力；Elo 表は単一 Verdict ではない。`,
    },
    {
      zh: `无 model_a/model_b 配对或 judge_rationale 的单次 API 响应不能作为 Arena 式 ${nodeId} pairwise 评估。`,
      en: `Single API response without model_a/model_b pairing or judge_rationale cannot serve as Arena-style ${nodeId} pairwise evaluation.`,
      ja: `pairwise 欠落応答は Arena 式 ${nodeId} として拒否。`,
    },
    {
      zh: `Arena 实例：model_a=gpt-4 vs model_b=claude-3 → judge picks A → Elo delta +0.03 → 映射 ${nodeId} Verdict outcome=preferred_a。`,
      en: `Arena instance: model_a vs model_b → judge picks A → Elo delta +0.03 → maps to ${nodeId} Verdict outcome=preferred_a.`,
      ja: `Arena 实例 pairwise→Elo が ${nodeId} Verdict に写像。`,
    },
  ),
  agentbench: kindMap(
    {
      zh: `AgentBench (Liu et al., 2023) 8 环境评估 LLM agent：OS、DB、KG、Digital Card Game、Lateral Thinking、House Holding、Web Shopping、Web Browsing；${nodeId} 映射多环境 EvaluationScenario/Run 与能力 Rubric。`,
      en: `AgentBench (Liu et al., 2023) evaluates LLM agents in 8 envs: OS, DB, KG, Digital Card Game, Lateral Thinking, House Holding, Web Shopping, Web Browsing; ${nodeId} maps multi-env EvaluationScenario/Run and capability Rubric.`,
      ja: `AgentBench 8 環境 OS/DB/KG 等；${nodeId} はシナリオ/Run。`,
    },
    {
      zh: `AgentBench 环境 success_rate 是聚合指标；${nodeId} 记录单次 scenario run，不能把全局 leaderboard 当作一次 EvaluationRun。`,
      en: `AgentBench env success_rate is aggregate metric; ${nodeId} records one scenario run—global leaderboard is not one EvaluationRun.`,
      ja: `AgentBench success_rate は集約；単一 Run と混同不可。`,
    },
    {
      zh: `无 environment_id 与 task_instance_ref 的文本描述不能作为 AgentBench 式 ${nodeId} EvaluationScenario。`,
      en: `Text description without environment_id and task_instance_ref cannot serve as AgentBench-style ${nodeId} EvaluationScenario.`,
      ja: `environment_id 欠落は AgentBench 式 ${nodeId} として拒否。`,
    },
    {
      zh: `AgentBench 实例：env=web_shopping task_id=ws-042 → agent actions → success=false → 映射 ${nodeId} EvaluationRun run_id=agentbench-ws-042。`,
      en: `AgentBench instance: env=web_shopping task_id=ws-042 → agent actions → success=false → maps to ${nodeId} EvaluationRun run_id=agentbench-ws-042.`,
      ja: `AgentBench 实例 web_shopping task が ${nodeId} Run に写像。`,
    },
  ),
  swe_bench: kindMap(
    {
      zh: `SWE-bench (Jimenez et al., 2024, Princeton) 2,294 真实 GitHub issue+PR；评估 resolved rate (%)：agent 生成 patch 能否通过 repo 测试；${nodeId} 映射代码修复 EvaluationScenario/Score。`,
      en: `SWE-bench (Jimenez et al., 2024, Princeton) 2,294 real GitHub issues+PRs; metric resolved rate (%): whether agent patch passes repo tests; ${nodeId} maps code-fix EvaluationScenario/Score.`,
      ja: `SWE-bench 2294 issue+PR、resolved rate；${nodeId} はコード修復評価。`,
    },
    {
      zh: `SWE-bench resolved 是二元/通过率 Score；Rubric 定义"通过测试套件"标准；${nodeId} 记录一次 run 结果，不能把 issue 标题当 Verdict。`,
      en: `SWE-bench resolved is binary/pass-rate Score; Rubric defines "pass test suite" criteria; ${nodeId} records one run result—issue title is not Verdict.`,
      ja: `SWE-bench resolved は Score；issue タイトルは Verdict ではない。`,
    },
    {
      zh: `无 repo/commit/test_log_ref 的 diff 文本不能作为 SWE-bench 式 ${nodeId} EvaluationRun 证据。`,
      en: `Diff text without repo/commit/test_log_ref cannot serve as SWE-bench-style ${nodeId} EvaluationRun evidence.`,
      ja: `repo/commit 欠落 diff は SWE-bench 式 ${nodeId} として拒否。`,
    },
    {
      zh: `SWE-bench 实例：django__django-11099 → patch applied → tests passed → resolved=true → score_value=1.0 → 映射 ${nodeId} Score metric=resolved_rate。`,
      en: `SWE-bench instance: django__django-11099 → patch applied → tests passed → resolved=true → score_value=1.0 → maps to ${nodeId} Score metric=resolved_rate.`,
      ja: `SWE-bench 实例 patch→tests passed が ${nodeId} Score に写像。`,
    },
  ),
  openai_evals: kindMap(
    {
      zh: `OpenAI Evals：client.evals.create(name="...", data_source_config={...}, testing_criteria=[...])；Graders 含 string_check、model_graded、text_similarity；${nodeId} 映射 EvaluationRun/Criterion/Rubric/Score 的正式 eval 配置。`,
      en: `OpenAI Evals: client.evals.create(name, data_source_config, testing_criteria=[...]); Graders include string_check, model_graded, text_similarity; ${nodeId} maps formal EvaluationRun/Criterion/Rubric/Score eval configuration.`,
      ja: `OpenAI Evals create+string_check/model_graded；${nodeId} は eval 設定。`,
    },
    {
      zh: `OpenAI Evals testing_criteria 是 Rubric/Criterion 规范；eval run 输出是 Score；${nodeId} 须区分配置与单次运行结果。`,
      en: `OpenAI Evals testing_criteria are Rubric/Criterion spec; eval run output is Score; ${nodeId} must separate configuration from single-run results.`,
      ja: `testing_criteria は spec；run 出力は Score。`,
    },
    {
      zh: `无 testing_criteria 或 data_source_config 的 ad-hoc 脚本不能作为 OpenAI Evals 式 ${nodeId} EvaluationRun。`,
      en: `Ad-hoc script without testing_criteria or data_source_config cannot serve as OpenAI Evals-style ${nodeId} EvaluationRun.`,
      ja: `testing_criteria 欠落 ad-hoc は OpenAI Evals 式 ${nodeId} ではない。`,
    },
    {
      zh: `OpenAI Evals 实例：testing_criteria=[{type:"string_check", operation:"eq", reference:"Hardware"}] → run completed → 映射 ${nodeId} EvaluationRun eval_id=it-ticket-v1。`,
      en: `OpenAI Evals instance: testing_criteria string_check eq Hardware → run completed → maps to ${nodeId} EvaluationRun eval_id=it-ticket-v1.`,
      ja: `OpenAI Evals 实例 string_check が ${nodeId} Run に写像。`,
    },
  ),
  ragas: kindMap(
    {
      zh: `RAGAS：from ragas.metrics import faithfulness, context_precision, answer_relevancy；score = evaluate(dataset, metrics=[faithfulness, context_precision])；${nodeId} 映射 RAG 质量 EvaluationMetric/Score/Run。`,
      en: `RAGAS: from ragas.metrics import faithfulness, context_precision, answer_relevancy; score = evaluate(dataset, metrics=[faithfulness, context_precision]); ${nodeId} maps RAG quality EvaluationMetric/Score/Run.`,
      ja: `RAGAS faithfulness/context_precision/answer_relevancy；${nodeId} は RAG 品質メトリック。`,
    },
    {
      zh: `RAGAS faithfulness 衡量答案是否 grounded；LatencyMetric 是运行时成本；${nodeId} 记录语义质量分数，不能把 wall-clock 当 faithfulness。`,
      en: `RAGAS faithfulness measures answer grounding; LatencyMetric is runtime cost; ${nodeId} records semantic quality scores—wall-clock is not faithfulness.`,
      ja: `RAGAS faithfulness は grounded 性；latency と混同不可。`,
    },
    {
      zh: `无 retrieved_contexts 字段的数据集不能运行 RAGAS 式 ${nodeId} context_precision 评估。`,
      en: `Dataset without retrieved_contexts field cannot run RAGAS-style ${nodeId} context_precision evaluation.`,
      ja: `retrieved_contexts 欠落は RAGAS 式 ${nodeId} として拒否。`,
    },
    {
      zh: `RAGAS 实例：evaluate(dataset, metrics=[faithfulness]) → faithfulness=0.87 → 映射 ${nodeId} Score metric_id=ragas-faithfulness。`,
      en: `RAGAS instance: evaluate(..., metrics=[faithfulness]) → faithfulness=0.87 → maps to ${nodeId} Score metric_id=ragas-faithfulness.`,
      ja: `RAGAS 实例 faithfulness=0.87 が ${nodeId} Score に写像。`,
    },
  ),
  braintrust: kindMap(
    {
      zh: `Braintrust：from braintrust import Eval; Eval("my-project", data=dataset, task=my_task, scores=[Factuality])；${nodeId} 映射 EvaluationRun/Score/EvaluationCriterion 的可复现实验框架。`,
      en: `Braintrust: from braintrust import Eval; Eval("my-project", data=dataset, task=my_task, scores=[Factuality]); ${nodeId} maps EvaluationRun/Score/EvaluationCriterion reproducible experiment framework.`,
      ja: `Braintrust Eval(project, data, task, scores)；${nodeId} は評価 Run。`,
    },
    {
      zh: `Braintrust scores 是自定义 scorer 输出；EvaluationCriterion 是 pass/fail 规则；${nodeId} 记录 scorer 结果，不能把 project 配置当 Verdict。`,
      en: `Braintrust scores are custom scorer output; EvaluationCriterion is pass/fail rule; ${nodeId} records scorer results—project config is not Verdict.`,
      ja: `Braintrust scores は scorer 出力；project 設定は Verdict ではない。`,
    },
    {
      zh: `无 task 函数与 scores 列表的 JSON 配置不能作为 Braintrust 式 ${nodeId} EvaluationRun。`,
      en: `JSON config without task function and scores list cannot serve as Braintrust-style ${nodeId} EvaluationRun.`,
      ja: `task/scores 欠落 JSON は Braintrust 式 ${nodeId} ではない。`,
    },
    {
      zh: `Braintrust 实例：Eval("support-bot", scores=[Factuality]) → Factuality=0.92 → 映射 ${nodeId} Score scorer=Factuality。`,
      en: `Braintrust instance: Eval("support-bot", scores=[Factuality]) → Factuality=0.92 → maps to ${nodeId} Score scorer=Factuality.`,
      ja: `Braintrust 实例 Factuality=0.92 が ${nodeId} Score に写像。`,
    },
  ),
  wandb: kindMap(
    {
      zh: `Weights & Biases：wandb.init(project="agent-eval"); wandb.log({"accuracy": 0.95, "latency": 1.2})；${nodeId} 映射 EvaluationMetric/Score/EvaluationCostMetric 的训练与 eval 遥测。`,
      en: `Weights & Biases: wandb.init(project="agent-eval"); wandb.log({"accuracy": 0.95, "latency": 1.2}); ${nodeId} maps EvaluationMetric/Score/EvaluationCostMetric training and eval telemetry.`,
      ja: `W&B wandb.init+wandb.log accuracy/latency；${nodeId} は eval テレメトリ。`,
    },
    {
      zh: `wandb.log latency 是 EvaluationCostMetric；accuracy 是 Score；${nodeId} 须标明 metric_kind，不能把 dashboard 截图当 Rubric。`,
      en: `wandb.log latency is EvaluationCostMetric; accuracy is Score; ${nodeId} must state metric_kind—dashboard screenshot is not Rubric.`,
      ja: `W&B latency は cost metric；accuracy は Score。`,
    },
    {
      zh: `无 run_id/project 的本地 print 语句不能作为 W&B 式 ${nodeId} EvaluationMetric 记录。`,
      en: `Local print statements without run_id/project cannot serve as W&B-style ${nodeId} EvaluationMetric record.`,
      ja: `run_id 欠落 print は W&B 式 ${nodeId} ではない。`,
    },
    {
      zh: `W&B 实例：wandb.log({"eval_cost_usd": 0.042, "tokens": 1500}) → 映射 ${nodeId} EvaluationCostMetric metric_id=eval-cost-usd。`,
      en: `W&B instance: wandb.log({"eval_cost_usd": 0.042, "tokens": 1500}) → maps to ${nodeId} EvaluationCostMetric metric_id=eval-cost-usd.`,
      ja: `W&B 实例 eval_cost_usd が ${nodeId} CostMetric に写像。`,
    },
  ),
  dspy_optimizers: kindMap(
    {
      zh: `DSPy Optimizers：teleprompter = BootstrapFewShotWithRandomSearch(metric=my_metric, max_bootstrapped_demos=4); compiled = teleprompter.compile(RAG(), trainset=trainset)；${nodeId} 映射 ChangeProposal/LearningSignal/RewardModelScore 的 prompt/策略优化提案。`,
      en: `DSPy Optimizers: teleprompter = BootstrapFewShotWithRandomSearch(metric=my_metric, max_bootstrapped_demos=4); compiled = teleprompter.compile(RAG(), trainset=trainset); ${nodeId} maps ChangeProposal/LearningSignal/RewardModelScore prompt/policy optimization proposals.`,
      ja: `DSPy BootstrapFewShotWithRandomSearch→compile(RAG)；${nodeId} は最適化提案。`,
    },
    {
      zh: `DSPy compiled program 是优化后运行时 artifact；ChangeProposal 是待批准变更；${nodeId} 记录提案边界，不能把 compile 输出直接当已部署策略。`,
      en: `DSPy compiled program is optimized runtime artifact; ChangeProposal is pending approved change; ${nodeId} records proposal boundary—compile output is not deployed policy.`,
      ja: `DSPy compiled は artifact；ChangeProposal は承認待ち。`,
    },
    {
      zh: `无 metric 与 trainset 的 teleprompter.compile() 调用不能作为 DSPy 式 ${nodeId} ChangeProposal。`,
      en: `teleprompter.compile() without metric and trainset cannot serve as DSPy-style ${nodeId} ChangeProposal.`,
      ja: `metric/trainset 欠落 compile は DSPy 式 ${nodeId} ではない。`,
    },
    {
      zh: `DSPy 实例：BootstrapFewShotWithRandomSearch → compiled demos=4 → proposal_id=prompt-opt-v3 → 映射 ${nodeId} ChangeProposal target=prompt-template。`,
      en: `DSPy instance: BootstrapFewShotWithRandomSearch → compiled demos=4 → proposal_id=prompt-opt-v3 → maps to ${nodeId} ChangeProposal target=prompt-template.`,
      ja: `DSPy 实例 compile→proposal が ${nodeId} ChangeProposal に写像。`,
    },
  ),
};

export const NODE_SOURCE_MAP = {
  LearningSignal: ['instructgpt', 'dpo', 'reflexion', 'dspy_optimizers'],
  PreferenceExample: ['instructgpt', 'dpo', 'dspy_optimizers'],
  RewardModelScore: ['instructgpt', 'dpo', 'dspy_optimizers'],
  ChangeProposal: ['dpo', 'self_refine', 'dspy_optimizers'],
  Feedback: ['self_refine', 'reflexion', 'constitutional_ai'],
  HumanFeedback: ['instructgpt', 'constitutional_ai', 'chatbot_arena'],
  RevisionArtifact: ['self_refine', 'reflexion', 'constitutional_ai'],
  EvaluationRun: ['self_refine', 'openai_evals', 'ragas', 'agentbench'],
  Score: ['chatbot_arena', 'ragas', 'braintrust', 'wandb'],
  Verdict: ['chatbot_arena', 'agentbench', 'swe_bench'],
  EvaluationScenario: ['chatbot_arena', 'agentbench', 'swe_bench'],
  Rubric: ['constitutional_ai', 'openai_evals', 'agentbench'],
  EvaluationCriterion: ['openai_evals', 'braintrust', 'constitutional_ai'],
  EvaluationMetric: ['ragas', 'wandb', 'braintrust'],
  EvaluationCostMetric: ['wandb', 'ragas', 'openai_evals'],
  EvaluationSpecification: ['openai_evals', 'agentbench', 'swe_bench'],
};

export const MODULE_SOURCE_MAP = {
  'feedback-metrics-evaluation': ['chatbot_arena', 'ragas', 'openai_evals', 'swe_bench'],
  'feedback-optimization-learning': ['instructgpt', 'dpo', 'dspy_optimizers', 'reflexion'],
  'feedback-review-optimization': ['self_refine', 'reflexion', 'constitutional_ai'],
  'feedback-plane': ['instructgpt', 'ragas', 'agentbench', 'openai_evals'],
};

export function getModuleKey(relativePath) {
  const norm = relativePath.replace(/\\/g, '/');
  for (const key of Object.keys(MODULE_SOURCE_MAP)) {
    if (norm.includes(key)) return key;
  }
  return 'feedback-plane';
}

export function getSourcesForNode(nodeId, moduleKey) {
  if (NODE_SOURCE_MAP[nodeId]) return NODE_SOURCE_MAP[nodeId].slice(0, 4);
  return (MODULE_SOURCE_MAP[moduleKey] || MODULE_SOURCE_MAP['feedback-plane']).slice(0, 4);
}

export function generateDescription(sourceId, ctx) {
  const fn = SOURCE_TEMPLATES[sourceId];
  if (!fn) throw new Error(`Unknown source: ${sourceId}`);
  return fn(ctx);
}
