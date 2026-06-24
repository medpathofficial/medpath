/* ═══════════════════════════════════════════
   MEDPATH — ENGINES
   Version: 1.0

   Contains four engines:
   1. Recovery Engine    (imported topics only)
   2. Revision Engine    (observed topics only)
   3. Health Engine      (explanation only, never stored)
   4. Daily Capacity     (final allocation, never stored)

   Constitutional rules:
   - Engines NEVER write to localStorage
   - Engines NEVER modify raw input
   - Engines work on copies only
   - Engines skip "archived" topics (C2 fix)
   - Daily Capacity applies exam emergency floor (C1 fix)
═══════════════════════════════════════════ */


/* ═══════════════════════════════════════════
   SECTION 1 — UNIVERSAL CONSTANTS
═══════════════════════════════════════════ */

const IMPORTANCE_WEIGHTS = {
  "Essential":  40,
  "Foundation": 20,
  "Standard":   10,
  DEFAULT:      10
};

const RECALL_WEIGHTS = {
  1: 40,   /* Poor */
  2: 25,   /* Fair */
  3: 10,   /* Good */
  4: 0,    /* Strong */
  DEFAULT: 25
};

const RECALL_WEIGHT_FRESH = 10;  /* totalRevisions = 0 */

const UNDERSTANDING_WEIGHTS = {
  1: 20,   /* Poor */
  2: 10,   /* Fair */
  3: 5,    /* Good */
  4: 0,    /* Strong */
  DEFAULT: 5
};

const RECOVERY_ESTIMATE_WEIGHTS = {
  1: 40,
  2: 25,
  3: 10,
  4: 0,
  DEFAULT: 40
};

const OBSERVATION_GAP_WEIGHTS = {
  large:  30,   /* > 66% imported */
  medium: 15,   /* 33-66% imported */
  small:  5     /* < 33% imported */
};

const OBSERVATION_GAP_THRESHOLDS = {
  large: 0.66,
  small: 0.33
};

const TREND_ADJUSTMENT = {
  improving: -1,
  stable:     0,
  declining:  1
};

const MIN_ENTRIES_FOR_TREND = 3;
const TREND_BAND = 0.3;
const MICRO_RANDOMIZER_RANGE = 0.5;


/* ═══════════════════════════════════════════
   SECTION 2 — HEALTH ENGINE CONSTANTS
═══════════════════════════════════════════ */

const HEALTH_SCORE_WEIGHTS = {
  coverage:      0.20,
  retention:     0.40,
  understanding: 0.20,
  consistency:   0.20
};

const SCORE_HEALTH_MAPPING = {
  1: 25,
  2: 50,
  3: 75,
  4: 100
};

const DEFAULT_RECALL_MAPPED        = 50;  /* Fair */
const DEFAULT_UNDERSTANDING_MAPPED = 50;  /* Fair */

const RISK_THRESHOLDS = {
  healthy: 80,
  monitor: 60,
  atRisk:  40
};

const DIAGNOSIS_THRESHOLDS = {
  coverageDeficit:      30,
  retentionRisk:        50,
  understandingDeficit: 40,
  consistencyDecline:   40
};

const CONSISTENCY_MAX_WINDOW_DAYS = 30;
const MINIMUM_OBSERVED_TOPICS     = 5;


/* ═══════════════════════════════════════════
   SECTION 3 — DAILY CAPACITY CONSTANTS
═══════════════════════════════════════════ */

const CAPACITY_LEVELS = {
  light:  5,
  normal: 10,
  heavy:  15
};

const DEFAULT_CAPACITY = "normal";

const BASE_ALLOCATION = {
  light:  { revision: 3, recovery: 1, study: 1 },
  normal: { revision: 5, recovery: 3, study: 2 },
  heavy:  { revision: 8, recovery: 4, study: 3 }
};

const PROXIMITY_MULTIPLIERS = {
  "60+":   1.0,
  "45-60": 1.1,
  "30-45": 1.2,
  "15-30": 1.3,
  "7-15":  1.5,
  "0-7":   1.8
};

const RETENTION_THRESHOLDS = {
  critical:   40,
  borderline: 60
};

const RETENTION_ADJUSTMENT = {
  critical:   { addRevision: 2, removeRecovery: 1, removeStudy: 1 },
  borderline: { addRevision: 1, removeRecovery: 0, removeStudy: 1 },
  normal:     { addRevision: 0, removeRecovery: 0, removeStudy: 0 }
};

const VERIFY_CAP_RULES = {
  default:    3,
  examWarn:   5,    /* exam <= 14 days, pool > 30 */
  examEmerg:  6     /* exam <= 7 days,  pool > 20 */
};

/* C1 FIX — Exam Emergency Floor */
const EXAM_EMERGENCY_FLOOR = {
  emergency: {
    daysThreshold:    7,
    poolThreshold:    20,
    minimumRecovery:  4
  },
  warning: {
    daysThreshold:    14,
    poolThreshold:    30,
    minimumRecovery:  3
  }
};

const REVISION_DUE_THRESHOLD = 50;


/* ═══════════════════════════════════════════
   SECTION 4 — UTILITY FUNCTIONS
═══════════════════════════════════════════ */

function eng_round(n) {
  return Math.round(n);
}

function eng_clamp(value, min, max) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function eng_microRandom() {
  return (Math.random() * MICRO_RANDOMIZER_RANGE * 2) - MICRO_RANDOMIZER_RANGE;
}

function eng_sum(arr) {
  let total = 0;
  for (const v of arr) total += v;
  return total;
}

function eng_capitalise(s) {
  if (!s || typeof s !== "string") return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function eng_scoreLabel(score) {
  if (score === 1) return "poor";
  if (score === 2) return "fair";
  if (score === 3) return "good";
  if (score === 4) return "strong";
  return "unknown";
}


/* ═══════════════════════════════════════════
   SECTION 5 — TIME WEIGHT
═══════════════════════════════════════════ */

function getTimeWeight(daysSince) {
  if (daysSince <= 3)  return 0;
  if (daysSince <= 7)  return 5;
  if (daysSince <= 14) return 15;
  if (daysSince <= 30) return 25;
  return 40;
}


/* ═══════════════════════════════════════════
   SECTION 6 — TREND CALCULATION
═══════════════════════════════════════════ */

function calculateTrend(recallHistory) {

  if (!recallHistory || recallHistory.length < MIN_ENTRIES_FOR_TREND) {
    return "stable";
  }

  const midpoint   = Math.floor(recallHistory.length / 2);
  const firstHalf  = recallHistory.slice(0, midpoint);
  const secondHalf = recallHistory.slice(midpoint);

  if (firstHalf.length === 0 || secondHalf.length === 0) {
    return "stable";
  }

  const firstAvg  = eng_sum(firstHalf)  / firstHalf.length;
  const secondAvg = eng_sum(secondHalf) / secondHalf.length;
  const diff = secondAvg - firstAvg;

  if (diff >  TREND_BAND) return "improving";
  if (diff < -TREND_BAND) return "declining";
  return "stable";
}


/* ═══════════════════════════════════════════
   SECTION 7 — REVISION ENGINE
═══════════════════════════════════════════ */

function runRevisionEngine(topicStates, curriculum) {

  const candidates = [];

  if (!topicStates) return candidates;

  for (const topicId in topicStates) {
    const state = topicStates[topicId];
    if (!state) continue;

    /* Skip imported topics */
    if (state.knowledgeSource === "imported") continue;

    /* C2 fix — skip archived topics */
    if (state.knowledgeSource === "archived") continue;

    /* Require some study evidence */
    if (!state.firstStudiedDate) continue;

    /* Find topic in curriculum */
    const curriculumTopic = (typeof getCurriculumTopic === "function")
      ? getCurriculumTopic(topicId, curriculum)
      : null;

    if (!curriculumTopic) continue;

    const score = calculateRevisionScore(state, curriculumTopic);
    const reason = generateRevisionReason(state, curriculumTopic);
    const daysSince = (typeof calculateDaysSinceLastInteraction === "function")
      ? calculateDaysSinceLastInteraction(state)
      : 0;

    candidates.push({
      topicId: topicId,
      topicName: curriculumTopic.topicName,
      subjectName: curriculumTopic.subjectName,
      chapterName: curriculumTopic.chapterName,
      revisionScore: score,
      rawScore: score,
      reason: reason,
      importance: curriculumTopic.importance,
      daysSince: daysSince,
      source: "revision"
    });
  }

  return sortRevisionCandidates(candidates);
}

function calculateRevisionScore(state, curriculumTopic) {

  /* Importance */
  const importanceWeight =
    IMPORTANCE_WEIGHTS[curriculumTopic.importance] !== undefined
      ? IMPORTANCE_WEIGHTS[curriculumTopic.importance]
      : IMPORTANCE_WEIGHTS.DEFAULT;

  /* Recall */
  let recallWeight;
  if (state.totalRevisions === 0) {
    recallWeight = RECALL_WEIGHT_FRESH;
  } else if (state.lastRecallScore === null || state.lastRecallScore === undefined) {
    recallWeight = RECALL_WEIGHTS.DEFAULT;
  } else {
    recallWeight = RECALL_WEIGHTS[state.lastRecallScore];
  }

  /* Understanding */
  const understandingWeight =
    state.lastUnderstandingScore === null || state.lastUnderstandingScore === undefined
      ? UNDERSTANDING_WEIGHTS.DEFAULT
      : UNDERSTANDING_WEIGHTS[state.lastUnderstandingScore];

  /* Time */
  const daysSince = (typeof calculateDaysSinceLastInteraction === "function")
    ? calculateDaysSinceLastInteraction(state)
    : 0;
  const timeWeight = getTimeWeight(daysSince);

  let baseScore = importanceWeight + recallWeight + understandingWeight + timeWeight;

  /* Trend adjustment */
  const trend = calculateTrend(state.recallHistory);
  baseScore += TREND_ADJUSTMENT[trend];

  if (baseScore < 0) baseScore = 0;

  return baseScore;
}

function sortRevisionCandidates(candidates) {

  /* Micro-random sort score */
  for (const c of candidates) {
    c.sortScore = c.revisionScore + eng_microRandom();
  }

  candidates.sort(function(a, b) {

    if (b.sortScore !== a.sortScore) {
      return b.sortScore - a.sortScore;
    }

    /* Tiebreaker 1: importance */
    const wA = IMPORTANCE_WEIGHTS[a.importance] || 10;
    const wB = IMPORTANCE_WEIGHTS[b.importance] || 10;
    if (wB !== wA) return wB - wA;

    /* Tiebreaker 2: longer time since interaction wins */
    return (b.daysSince || 0) - (a.daysSince || 0);
  });

  return candidates;
}

function generateRevisionReason(state, curriculumTopic) {

  const daysSince = (typeof calculateDaysSinceLastInteraction === "function")
    ? calculateDaysSinceLastInteraction(state)
    : 0;

  if (state.totalRevisions === 0) {
    return "Studied " + daysSince + " days ago. Time for first revision.";
  }

  if (daysSince > 30) {
    return "Not revised in " + daysSince + " days. Needs urgent attention.";
  }

  const trend = calculateTrend(state.recallHistory);
  if (trend === "declining") {
    return "Recall has been declining recently. Needs reinforcement.";
  }

  if (state.lastRecallScore === 1) {
    return "Last revised " + daysSince + " days ago. Recall was poor.";
  }
  if (state.lastRecallScore === 2) {
    return "Last revised " + daysSince + " days ago. Recall was fair.";
  }
  if (state.lastRecallScore === 3) {
    return "Last revised " + daysSince + " days ago. Recall was good.";
  }
  if (state.lastRecallScore === 4) {
    return "Last revised " + daysSince + " days ago. Recall was strong.";
  }

  return "Last revised " + daysSince + " days ago.";
}


/* ═══════════════════════════════════════════
   SECTION 8 — RECOVERY ENGINE
═══════════════════════════════════════════ */

function runRecoveryEngine(importedData, topicStates, curriculum) {

  const priorities = [];

  if (!importedData || importedData.length === 0) return priorities;

  /* Pre-compute observation gaps per chapter */
  const chapterGaps = computeAllChapterGaps(importedData, topicStates, curriculum);

  for (const record of importedData) {
    const topicId = record.topicId;
    if (!topicId) continue;

    const state = topicStates ? topicStates[topicId] : null;

    /* Skip already observed */
    if (state && state.knowledgeSource === "observed") continue;

    /* C2 fix — skip archived */
    if (state && state.knowledgeSource === "archived") continue;

    const curriculumTopic = (typeof getCurriculumTopic === "function")
      ? getCurriculumTopic(topicId, curriculum)
      : null;
    if (!curriculumTopic) continue;

    const gapCategory = chapterGaps[curriculumTopic.chapterId] || "medium";
    const score  = calculateRecoveryScore(record, curriculumTopic, gapCategory);
    const reason = generateRecoveryReason(record, curriculumTopic, score);

    priorities.push({
      topicId: topicId,
      topicName: curriculumTopic.topicName,
      subjectName: curriculumTopic.subjectName,
      chapterName: curriculumTopic.chapterName,
      recoveryScore: score,
      rawScore: score,
      reason: reason,
      importance: curriculumTopic.importance,
      importedDate: record.importedDate,
      recallEstimate: record.recallEstimate,
      source: "recovery"
    });
  }

  return sortRecoveryPriorities(priorities);
}

function computeAllChapterGaps(importedData, topicStates, curriculum) {

  const chapterMap = {};

  /* Count total topics per chapter from curriculum */
  if (curriculum && curriculum.subjects) {
    for (const subject of curriculum.subjects) {
      for (const section of subject.sections) {
        for (const chapter of section.chapters) {
          chapterMap[chapter.chapterId] = {
            total: chapter.topics.length,
            stillImported: 0
          };
        }
      }
    }
  }

  /* Count remaining imported per chapter */
  for (const record of importedData) {
    const tid = record.topicId;
    const state = topicStates ? topicStates[tid] : null;
    if (state && (state.knowledgeSource === "observed" || state.knowledgeSource === "archived")) continue;

    const curriculumTopic = (typeof getCurriculumTopic === "function")
      ? getCurriculumTopic(tid, curriculum)
      : null;
    if (!curriculumTopic) continue;

    const cid = curriculumTopic.chapterId;
    if (chapterMap[cid]) {
      chapterMap[cid].stillImported += 1;
    }
  }

  /* Categorize */
  const gapMap = {};
  for (const cid in chapterMap) {
    const total = chapterMap[cid].total;
    const remaining = chapterMap[cid].stillImported;

    let category;
    if (total === 0) {
      category = "small";
    } else {
      const ratio = remaining / total;
      if (ratio > OBSERVATION_GAP_THRESHOLDS.large)      category = "large";
      else if (ratio < OBSERVATION_GAP_THRESHOLDS.small) category = "small";
      else                                                category = "medium";
    }
    gapMap[cid] = category;
  }

  return gapMap;
}

function calculateRecoveryScore(record, curriculumTopic, gapCategory) {

  const importanceWeight =
    IMPORTANCE_WEIGHTS[curriculumTopic.importance] !== undefined
      ? IMPORTANCE_WEIGHTS[curriculumTopic.importance]
      : IMPORTANCE_WEIGHTS.DEFAULT;

  const estimateWeight =
    RECOVERY_ESTIMATE_WEIGHTS[record.recallEstimate] !== undefined
      ? RECOVERY_ESTIMATE_WEIGHTS[record.recallEstimate]
      : RECOVERY_ESTIMATE_WEIGHTS.DEFAULT;

  const gapWeight = OBSERVATION_GAP_WEIGHTS[gapCategory] || OBSERVATION_GAP_WEIGHTS.medium;

  return importanceWeight + estimateWeight + gapWeight;
}

function sortRecoveryPriorities(priorities) {

  for (const p of priorities) {
    p.sortScore = p.recoveryScore + eng_microRandom();
  }

  priorities.sort(function(a, b) {

    if (b.sortScore !== a.sortScore) {
      return b.sortScore - a.sortScore;
    }

    /* Tiebreaker 1: importance */
    const wA = IMPORTANCE_WEIGHTS[a.importance] || 10;
    const wB = IMPORTANCE_WEIGHTS[b.importance] || 10;
    if (wB !== wA) return wB - wA;

    /* Tiebreaker 2: imported longer ago wins */
    if (a.importedDate && b.importedDate) {
      return new Date(a.importedDate) - new Date(b.importedDate);
    }
    return 0;
  });

  return priorities;
}

function generateRecoveryReason(record, curriculumTopic, score) {

  const recallLabel = eng_scoreLabel(record.recallEstimate);

  if (score >= 80) {
    return "Essential topic marked with " + recallLabel + " recall. Needs verification soon.";
  }

  if (curriculumTopic.importance === "Essential") {
    return "You marked this as studied with " + recallLabel + " recall. Worth checking.";
  }

  if (record.recallEstimate === 1) {
    return "You marked this with poor recall. Time to verify what you remember.";
  }

  return "Marked as studied with " + recallLabel + " recall. Ready for verification.";
}


/* ═══════════════════════════════════════════
   SECTION 9 — HEALTH ENGINE
═══════════════════════════════════════════ */

function runHealthEngine(topicStates, studyEvents, revisionEvents, curriculum, profile) {

  /* Count observed topics (skip archived) */
  const observedTopics = [];
  if (topicStates) {
    for (const tid in topicStates) {
      const st = topicStates[tid];
      if (!st) continue;
      if (st.knowledgeSource === "observed") {
        observedTopics.push(tid);
      }
    }
  }

  if (observedTopics.length < MINIMUM_OBSERVED_TOPICS) {
    return {
      ready: false,
      message: "Keep studying. Your health report will be ready after a few more sessions."
    };
  }

  const coverage      = calculateCoverage(observedTopics, topicStates, curriculum);
  const retention     = calculateRetention(observedTopics, topicStates);
  const understanding = calculateUnderstanding(observedTopics, topicStates);
  const consistency   = calculateConsistency(studyEvents, revisionEvents, profile);

  const healthScore   = calculateHealthScore(coverage, retention, understanding, consistency);
  const riskStatus    = determineRiskStatus(healthScore);
  const interpretation = generateInterpretation(coverage, retention, understanding, consistency, riskStatus);
  const diagnoses     = detectDiagnoses(coverage, retention, understanding, consistency);
  const treatmentPlans = generateTreatmentPlans(diagnoses);

  return {
    ready: true,
    healthScore: eng_round(healthScore),
    riskStatus: riskStatus,
    interpretation: interpretation,
    vitals: {
      coverage:      eng_round(coverage),
      retention:     eng_round(retention),
      understanding: eng_round(understanding),
      consistency:   eng_round(consistency)
    },
    diagnoses: diagnoses,
    treatmentPlans: treatmentPlans
  };
}

function calculateCoverage(observedTopics, topicStates, curriculum) {

  const touchedSubjects = new Set();
  for (const tid of observedTopics) {
    const ct = (typeof getCurriculumTopic === "function")
      ? getCurriculumTopic(tid, curriculum)
      : null;
    if (ct) touchedSubjects.add(ct.subjectId);
  }

  let total = 0;
  if (typeof countTopicsInSubject === "function") {
    for (const sid of touchedSubjects) {
      total += countTopicsInSubject(sid, curriculum);
    }
  }

  if (total === 0) return 0;

  let coverage = (observedTopics.length / total) * 100;
  if (coverage > 100) coverage = 100;
  return coverage;
}

function calculateRetention(observedTopics, topicStates) {

  if (!observedTopics || observedTopics.length === 0) return 0;

  const mapped = [];
  for (const tid of observedTopics) {
    const st = topicStates[tid];
    if (!st) continue;
    if (st.lastRecallScore === null || st.lastRecallScore === undefined) {
      mapped.push(DEFAULT_RECALL_MAPPED);
    } else {
      mapped.push(SCORE_HEALTH_MAPPING[st.lastRecallScore] || DEFAULT_RECALL_MAPPED);
    }
  }

  if (mapped.length === 0) return 0;
  return eng_sum(mapped) / mapped.length;
}

function calculateUnderstanding(observedTopics, topicStates) {

  if (!observedTopics || observedTopics.length === 0) return 0;

  const mapped = [];
  for (const tid of observedTopics) {
    const st = topicStates[tid];
    if (!st) continue;
    if (st.lastUnderstandingScore === null || st.lastUnderstandingScore === undefined) {
      mapped.push(DEFAULT_UNDERSTANDING_MAPPED);
    } else {
      mapped.push(SCORE_HEALTH_MAPPING[st.lastUnderstandingScore] || DEFAULT_UNDERSTANDING_MAPPED);
    }
  }

  if (mapped.length === 0) return 0;
  return eng_sum(mapped) / mapped.length;
}

function calculateConsistency(studyEvents, revisionEvents, profile) {

  if (!profile || !profile.joinedDate) return 0;

  const joined = new Date(profile.joinedDate);
  const now = new Date();
  const daysJoined = Math.max(1, Math.floor((now - joined) / (1000 * 60 * 60 * 24)));
  const windowSize = Math.min(daysJoined, CONSISTENCY_MAX_WINDOW_DAYS);

  const windowStart = new Date(now);
  windowStart.setDate(windowStart.getDate() - windowSize);

  const activeDates = new Set();

  function addEventDate(eventDate) {
    if (!eventDate) return;
    const d = new Date(eventDate);
    if (d >= windowStart && d <= now) {
      const ds = d.toISOString().slice(0, 10);
      activeDates.add(ds);
    }
  }

  if (studyEvents) studyEvents.forEach(function(e) { addEventDate(e.date); });
  if (revisionEvents) revisionEvents.forEach(function(e) { addEventDate(e.date); });

  let consistency = (activeDates.size / windowSize) * 100;
  if (consistency > 100) consistency = 100;
  return consistency;
}

function calculateHealthScore(coverage, retention, understanding, consistency) {

  let score =
    (coverage      * HEALTH_SCORE_WEIGHTS.coverage)
  + (retention     * HEALTH_SCORE_WEIGHTS.retention)
  + (understanding * HEALTH_SCORE_WEIGHTS.understanding)
  + (consistency   * HEALTH_SCORE_WEIGHTS.consistency);

  if (score < 0)   score = 0;
  if (score > 100) score = 100;
  return score;
}

function determineRiskStatus(healthScore) {
  if (healthScore >= RISK_THRESHOLDS.healthy) return "Healthy";
  if (healthScore >= RISK_THRESHOLDS.monitor) return "Monitor";
  if (healthScore >= RISK_THRESHOLDS.atRisk)  return "At Risk";
  return "Critical";
}

function detectDiagnoses(coverage, retention, understanding, consistency) {
  const d = [];
  if (coverage      < DIAGNOSIS_THRESHOLDS.coverageDeficit)      d.push("Coverage Deficit");
  if (retention     < DIAGNOSIS_THRESHOLDS.retentionRisk)        d.push("Retention Risk");
  if (understanding < DIAGNOSIS_THRESHOLDS.understandingDeficit) d.push("Understanding Deficit");
  if (consistency   < DIAGNOSIS_THRESHOLDS.consistencyDecline)   d.push("Consistency Decline");
  return d;
}

function generateTreatmentPlans(diagnoses) {
  const plans = [];
  for (const dx of diagnoses) {
    if (dx === "Coverage Deficit") {
      plans.push({
        diagnosis: "Coverage Deficit",
        treatment: "Focus on studying new topics. Large portions of the syllabus are still untouched."
      });
    } else if (dx === "Retention Risk") {
      plans.push({
        diagnosis: "Retention Risk",
        treatment: "Prioritize revision over new study. Several topics show weak recall and need reinforcement."
      });
    } else if (dx === "Understanding Deficit") {
      plans.push({
        diagnosis: "Understanding Deficit",
        treatment: "Revisit topics where understanding was weak. Strong understanding builds lasting memory."
      });
    } else if (dx === "Consistency Decline") {
      plans.push({
        diagnosis: "Consistency Decline",
        treatment: "Try to engage with MedPath daily, even briefly. Regular small sessions protect memory better than occasional long ones."
      });
    }
  }
  return plans;
}

function generateInterpretation(coverage, retention, understanding, consistency, riskStatus) {

  const vitals = {
    coverage: coverage,
    retention: retention,
    understanding: understanding,
    consistency: consistency
  };

  let weakest = "coverage";
  let strongest = "coverage";
  for (const key in vitals) {
    if (vitals[key] < vitals[weakest]) weakest = key;
    if (vitals[key] > vitals[strongest]) strongest = key;
  }

  if (riskStatus === "Healthy") {
    return "Your learning system is in good shape. " + eng_capitalise(strongest) + " is particularly strong. Keep up your current routine.";
  }

  if (riskStatus === "Monitor") {
    if (weakest === "retention")     return "Overall learning is reasonable, but retention is showing some weakness. Focus on revision before studying new topics.";
    if (weakest === "coverage")      return "Retention and understanding are holding well, but coverage needs attention. Try adding new topics to your sessions.";
    if (weakest === "consistency")   return "Your knowledge quality is good, but engagement has been irregular. Try to open MedPath more regularly.";
    if (weakest === "understanding") return "Coverage is progressing, but understanding of some topics needs work. Revisit topics where understanding was weak.";
    return "Learning is progressing. Keep an eye on " + weakest + ".";
  }

  if (riskStatus === "At Risk") {
    if (weakest === "retention")     return "Retention is dropping. Several topics you studied earlier are at risk of being forgotten. Shift focus to revision immediately.";
    if (weakest === "coverage")      return "A large portion of the syllabus remains untouched. Prioritise studying new topics alongside revision.";
    if (weakest === "consistency")   return "Irregular engagement is hurting retention. Even short daily sessions will help significantly.";
    if (weakest === "understanding") return "Weak understanding is making retention fragile. Go back to difficult topics and rebuild from foundation.";
    return "Your learning system needs attention. Focus on " + weakest + " this week.";
  }

  /* Critical */
  return "Your learning system needs immediate attention. " + eng_capitalise(weakest) + " is critically low. Start with today's revision plan and be consistent this week.";
}

function generateExamPaceSignal(healthScore, examDate, todaysPlanCount, recoveryPoolSize) {

  if (!examDate) return null;

  const daysToExam = Math.floor((new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24));
  if (daysToExam <= 0) return null;

  if (healthScore >= 65 && recoveryPoolSize < 20 && daysToExam > 14) {
    return { signal: "green", message: "On track for your exam." };
  }
  if (healthScore >= 50 && daysToExam > 7) {
    return { signal: "yellow", message: "May need to pick up pace." };
  }
  return { signal: "red", message: "Needs urgent attention before exam." };
}

function generateBacklogSignal(recoveryPoolSize, revisionCandidatesCount) {

  const total = recoveryPoolSize + revisionCandidatesCount;
  if (total <= 5)  return null;
  if (total <= 15) return "A few topics waiting.";
  if (total <= 35) return "Several topics waiting.";
  return "Many topics waiting.";
}


/* ═══════════════════════════════════════════
   SECTION 10 — DAILY CAPACITY
═══════════════════════════════════════════ */

function runDailyCapacity(inputs) {

  if (!inputs) return { topics: [], totalCount: 0, generatedAt: new Date().toISOString() };

  const intensity = (inputs.settings && inputs.settings.studyIntensity) || DEFAULT_CAPACITY;
  const totalCapacity = CAPACITY_LEVELS[intensity] || CAPACITY_LEVELS.normal;

  /* Step 1: Base allocation */
  let allocation = Object.assign({}, BASE_ALLOCATION[intensity] || BASE_ALLOCATION.normal);

  /* Step 2: Proximity multiplier */
  const daysToExam = calculateDaysToExam(inputs.profile ? inputs.profile.examDate : null);
  const multiplier = getProximityMultiplier(daysToExam);

  const adjustedRevision = applyMultiplierToScores(inputs.revisionCandidates || [], multiplier);
  const adjustedRecovery = applyMultiplierToScores(inputs.recoveryPriorities || [], multiplier);

  /* Step 3: Retention adjustment */
  allocation = applyRetentionAdjustment(
    allocation,
    inputs.retentionVital !== undefined ? inputs.retentionVital : 100,
    intensity
  );

  /* Step 4 (C1 fix): Exam emergency floor */
  allocation = applyExamEmergencyFloor(
    allocation,
    daysToExam,
    (inputs.recoveryPriorities || []).length,
    intensity
  );

  /* Step 5: VERIFY cap */
  const verifyCap = getDynamicVerifyCap(daysToExam, (inputs.recoveryPriorities || []).length);
  if (allocation.recovery > verifyCap.cap) {
    const overflow = allocation.recovery - verifyCap.cap;
    allocation.recovery = verifyCap.cap;
    allocation.revision += overflow;
  }

  /* Step 6: Generate study candidates */
  const studyCandidates = generateStudyCandidates(
    inputs.topicStates || {},
    inputs.curriculum,
    inputs.profile ? inputs.profile.phase : null
  );

  /* Step 7: Select top N */
  const selectedRevision = adjustedRevision.slice(0, allocation.revision);
  const selectedRecovery = adjustedRecovery.slice(0, allocation.recovery);
  const selectedStudy    = studyCandidates.slice(0, allocation.study);

  /* Step 8: Redistribute empty slots */
  const finalPlan = redistributeEmptySlots(
    selectedRevision,
    selectedRecovery,
    selectedStudy,
    allocation,
    adjustedRevision,
    studyCandidates
  );

  /* Step 9: Source tagging is preserved through candidate objects */

  return {
    topics: finalPlan,
    totalCount: finalPlan.length,
    generatedAt: new Date().toISOString()
  };
}

function calculateDaysToExam(examDate) {
  if (!examDate) return null;
  const days = Math.floor((new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24));
  if (days < 0) return null;
  return days;
}

function getProximityMultiplier(daysToExam) {
  if (daysToExam === null) return PROXIMITY_MULTIPLIERS["60+"];
  if (daysToExam > 60) return PROXIMITY_MULTIPLIERS["60+"];
  if (daysToExam > 45) return PROXIMITY_MULTIPLIERS["45-60"];
  if (daysToExam > 30) return PROXIMITY_MULTIPLIERS["30-45"];
  if (daysToExam > 15) return PROXIMITY_MULTIPLIERS["15-30"];
  if (daysToExam > 7)  return PROXIMITY_MULTIPLIERS["7-15"];
  return PROXIMITY_MULTIPLIERS["0-7"];
}

function applyMultiplierToScores(candidates, multiplier) {

  if (!candidates || candidates.length === 0) return [];

  if (multiplier === 1.0) {
    /* Return a sorted copy by rawScore */
    const copy = candidates.slice();
    copy.sort(function(a, b) { return (b.rawScore || 0) - (a.rawScore || 0); });
    return copy;
  }

  const adjusted = [];
  for (const c of candidates) {
    const copy = Object.assign({}, c);
    copy.adjustedScore = (c.rawScore || 0) * multiplier;
    adjusted.push(copy);
  }
  adjusted.sort(function(a, b) { return (b.adjustedScore || 0) - (a.adjustedScore || 0); });
  return adjusted;
}

function applyRetentionAdjustment(allocation, retentionVital, intensity) {

  let state;
  if (retentionVital < RETENTION_THRESHOLDS.critical)        state = "critical";
  else if (retentionVital < RETENTION_THRESHOLDS.borderline) state = "borderline";
  else                                                       state = "normal";

  const adj = RETENTION_ADJUSTMENT[state];
  const updated = Object.assign({}, allocation);

  updated.revision += adj.addRevision;
  updated.recovery -= adj.removeRecovery;
  updated.study    -= adj.removeStudy;

  if (updated.revision < 0) updated.revision = 0;
  if (updated.recovery < 0) updated.recovery = 0;
  if (updated.study    < 0) updated.study    = 0;

  const totalCapacity = CAPACITY_LEVELS[intensity] || CAPACITY_LEVELS.normal;
  let totalAllocated = updated.revision + updated.recovery + updated.study;

  if (totalAllocated > totalCapacity) {
    let overflow = totalAllocated - totalCapacity;
    const reduceFromStudy = Math.min(overflow, updated.study);
    updated.study -= reduceFromStudy;
    overflow -= reduceFromStudy;
    if (overflow > 0) {
      updated.revision = Math.max(0, updated.revision - overflow);
    }
  }

  return updated;
}

/* C1 FIX — Exam Emergency Floor */
function applyExamEmergencyFloor(allocation, daysToExam, recoveryPoolSize, intensity) {

  if (daysToExam === null) return allocation;

  let minimumRecovery = 0;

  if (daysToExam <= EXAM_EMERGENCY_FLOOR.emergency.daysThreshold &&
      recoveryPoolSize > EXAM_EMERGENCY_FLOOR.emergency.poolThreshold) {
    minimumRecovery = EXAM_EMERGENCY_FLOOR.emergency.minimumRecovery;
  } else if (daysToExam <= EXAM_EMERGENCY_FLOOR.warning.daysThreshold &&
             recoveryPoolSize > EXAM_EMERGENCY_FLOOR.warning.poolThreshold) {
    minimumRecovery = EXAM_EMERGENCY_FLOOR.warning.minimumRecovery;
  } else {
    return allocation;
  }

  if (allocation.recovery >= minimumRecovery) return allocation;

  const updated = Object.assign({}, allocation);
  const deficit = minimumRecovery - updated.recovery;
  updated.recovery = minimumRecovery;
  updated.revision = Math.max(0, updated.revision - deficit);

  const totalCapacity = CAPACITY_LEVELS[intensity] || CAPACITY_LEVELS.normal;
  let totalAllocated = updated.revision + updated.recovery + updated.study;

  if (totalAllocated > totalCapacity) {
    let overflow = totalAllocated - totalCapacity;
    const reduceFromStudy = Math.min(overflow, updated.study);
    updated.study -= reduceFromStudy;
    overflow -= reduceFromStudy;
    if (overflow > 0) {
      updated.revision = Math.max(0, updated.revision - overflow);
    }
  }

  return updated;
}

function getDynamicVerifyCap(daysToExam, recoveryPoolSize) {

  if (daysToExam !== null && daysToExam <= 7 && recoveryPoolSize > 20) {
    return { cap: VERIFY_CAP_RULES.examEmerg, reason: "exam_emergency" };
  }
  if (daysToExam !== null && daysToExam <= 14 && recoveryPoolSize > 30) {
    return { cap: VERIFY_CAP_RULES.examWarn, reason: "exam_warning" };
  }
  return { cap: VERIFY_CAP_RULES.default, reason: "normal" };
}

function generateStudyCandidates(topicStates, curriculum, phase) {

  if (!curriculum) return [];

  const candidates = [];
  let orderCounter = 0;

  for (const subject of curriculum.subjects) {
    for (const section of subject.sections) {
      for (const chapter of section.chapters) {
        for (const topic of chapter.topics) {
          const state = topicStates[topic.topicId];
          const isUnstudied =
            !state ||
            (state.knowledgeSource === "imported" && !state.firstStudiedDate);

          if (isUnstudied) {
            candidates.push({
              topicId: topic.topicId,
              topicName: topic.topicName,
              importance: topic.importance,
              subjectId: subject.subjectId,
              subjectName: subject.subjectName,
              chapterId: chapter.chapterId,
              chapterName: chapter.chapterName,
              curriculumOrder: orderCounter++,
              rawScore: IMPORTANCE_WEIGHTS[topic.importance] || 10,
              reason: "Ready to learn.",
              source: "study"
            });
          }
        }
      }
    }
  }

  candidates.sort(function(a, b) {
    if (a.curriculumOrder !== b.curriculumOrder) {
      return a.curriculumOrder - b.curriculumOrder;
    }
    return (b.rawScore || 0) - (a.rawScore || 0);
  });

  return candidates;
}

function redistributeEmptySlots(
  selectedRevision,
  selectedRecovery,
  selectedStudy,
  allocation,
  adjustedRevision,
  studyCandidates
) {

  const unusedRevision = allocation.revision - selectedRevision.length;
  const unusedRecovery = allocation.recovery - selectedRecovery.length;
  const unusedStudy    = allocation.study    - selectedStudy.length;

  const totalUnused = unusedRevision + unusedRecovery + unusedStudy;

  let extraRevision = [];
  let extraStudy = [];

  if (totalUnused > 0) {

    const alreadyIds = new Set();
    for (const t of selectedRevision) alreadyIds.add(t.topicId);
    for (const t of selectedRecovery) alreadyIds.add(t.topicId);
    for (const t of selectedStudy)    alreadyIds.add(t.topicId);

    /* Fill recovery shortfall with extra revision */
    if (unusedRecovery > 0) {
      for (const c of adjustedRevision) {
        if (extraRevision.length >= unusedRecovery) break;
        if (!alreadyIds.has(c.topicId)) {
          extraRevision.push(c);
          alreadyIds.add(c.topicId);
        }
      }
    }

    /* Fill remaining unused with study */
    const stillUnused =
      unusedRevision +
      (unusedRecovery - extraRevision.length) +
      unusedStudy;

    if (stillUnused > 0) {
      for (const c of studyCandidates) {
        if (extraStudy.length >= stillUnused) break;
        if (!alreadyIds.has(c.topicId)) {
          extraStudy.push(c);
          alreadyIds.add(c.topicId);
        }
      }
    }
  }

  return [].concat(
    selectedRevision,
    extraRevision,
    selectedRecovery,
    selectedStudy,
    extraStudy
  );
}


/* ═══════════════════════════════════════════
   SECTION 11 — DASHBOARD HELPERS
═══════════════════════════════════════════ */

function determineDashboardState(todaysPlan, profile, topicStates) {

  let observedCount = 0;
  if (topicStates) {
    for (const tid in topicStates) {
      if (topicStates[tid] && topicStates[tid].knowledgeSource === "observed") {
        observedCount += 1;
      }
    }
  }

  if (observedCount === 0 && profile && profile.onboardingType === "fresh") {
    return {
      state: "day1",
      message: "Nothing scheduled yet.",
      subMessage: "Want to study your first topic?",
      showSuggestion: true,
      showBeginButton: false
    };
  }

  if (todaysPlan && todaysPlan.topics && todaysPlan.topics.length > 0) {
    return {
      state: "active",
      message: "TODAY · " + todaysPlan.topics.length + " topics",
      showBeginButton: true,
      showSuggestion: false,
      examCountdown: getExamCountdown(profile ? profile.examDate : null),
      lastUpdated: todaysPlan.generatedAt
    };
  }

  return {
    state: "caughtUp",
    message: "Nothing scheduled.",
    subMessage: "Want to study something new?",
    showSuggestion: true,
    showBeginButton: false
  };
}

function getExamCountdown(examDate) {
  if (!examDate) return null;
  const days = Math.floor((new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return null;
  return days + " days to exam.";
}


/* ═══════════════════════════════════════════
   SECTION 12 — SESSION VIEW BUILDER
═══════════════════════════════════════════ */

function buildSessionView(todaysPlan) {

  const revise = [];
  const verify = [];
  const study  = [];

  if (todaysPlan && todaysPlan.topics) {
    for (const t of todaysPlan.topics) {
      if (t.source === "revision") revise.push(t);
      else if (t.source === "recovery") verify.push(t);
      else study.push(t);
    }
  }

  return {
    revise: revise,
    verify: verify,
    study:  study,
    showRevise: revise.length > 0,
    showVerify: verify.length > 0,
    showStudy:  study.length > 0
  };
}

function startFirstTopic(sessionView) {
  if (!sessionView) return null;
  if (sessionView.revise.length > 0) return sessionView.revise[0];
  if (sessionView.verify.length > 0) return sessionView.verify[0];
  if (sessionView.study.length > 0)  return sessionView.study[0];
  return null;
}


/* ═══════════════════════════════════════════
   SECTION 13 — TOPIC CARD CONTROLLER
═══════════════════════════════════════════ */

function determineTopicCardMode(topicId, topicStates) {

  const state = topicStates ? topicStates[topicId] : null;

  if (!state) {
    return { mode: "study", contextLine: null, headerNote: null };
  }

  if (state.knowledgeSource === "imported") {
    return {
      mode: "verify",
      contextLine: "You marked this as studied earlier.",
      headerNote: null
    };
  }

  if (state.knowledgeSource === "archived") {
    return { mode: "study", contextLine: null, headerNote: null };
  }

  if (state.knowledgeSource === "observed") {
    const daysSince = (typeof calculateDaysSinceLastInteraction === "function")
      ? calculateDaysSinceLastInteraction(state)
      : 0;

    if (state.totalRevisions === 0 && state.lastStudiedDate) {
      return {
        mode: "revision",
        contextLine: "Studied " + daysSince + " days ago · First revision",
        headerNote: "first_revision"
      };
    }

    if (state.totalRevisions > 0) {
      return {
        mode: "revision",
        contextLine: "Last revised " + daysSince + " days ago",
        headerNote: null
      };
    }

    return { mode: "study", contextLine: null, headerNote: null };
  }

  return { mode: "study", contextLine: null, headerNote: null };
}


/* ═══════════════════════════════════════════
   SECTION 14 — SUBJECTS PAGE STATUS
═══════════════════════════════════════════ */

function determineTopicStatus(topicId, state, revisionCandidates) {

  if (!state) return "not_started";
  if (state.knowledgeSource === "imported") return "not_started";
  if (state.knowledgeSource === "archived") return "not_started";

  let isDue = false;
  if (revisionCandidates) {
    for (const c of revisionCandidates) {
      if (c.topicId === topicId && c.revisionScore > REVISION_DUE_THRESHOLD) {
        isDue = true;
        break;
      }
    }
  }
  if (isDue) return "revision_due";

  if (state.knowledgeSource === "observed") return "studied";
  return "not_started";
}

function getStatusIndicator(status) {
  if (status === "not_started")  return "●";
  if (status === "studied")      return "✓";
  if (status === "revision_due") return "↻";
  return "●";
}


/* ═══════════════════════════════════════════
   SECTION 15 — TEST FUNCTION
═══════════════════════════════════════════ */

function testEngines() {

  console.log("=== MedPath Engines Test ===");

  if (typeof loadCurriculum !== "function") {
    console.log("Curriculum not available.");
    return;
  }

  const curriculum = loadCurriculum("phase_1");
  const topicStates = (typeof safeLoad === "function")
    ? safeLoad("medpath_topicStates", {})
    : {};
  const studyEvents = (typeof safeLoad === "function")
    ? safeLoad("medpath_studyEvents", [])
    : [];
  const revisionEvents = (typeof safeLoad === "function")
    ? safeLoad("medpath_revisionEvents", [])
    : [];
  const importedData = (typeof safeLoad === "function")
    ? safeLoad("medpath_importedData", [])
    : [];

  const profile = {
    joinedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    phase: "phase_1",
    examDate: null,
    onboardingType: "fresh"
  };

  const revisionCandidates = runRevisionEngine(topicStates, curriculum);
  console.log("Revision Candidates:", revisionCandidates.length);

  const recoveryPriorities = runRecoveryEngine(importedData, topicStates, curriculum);
  console.log("Recovery Priorities:", recoveryPriorities.length);

  const healthReport = runHealthEngine(topicStates, studyEvents, revisionEvents, curriculum, profile);
  console.log("Health Report:", healthReport);

  const todaysPlan = runDailyCapacity({
    revisionCandidates: revisionCandidates,
    recoveryPriorities: recoveryPriorities,
    topicStates: topicStates,
    curriculum: curriculum,
    profile: profile,
    settings: { studyIntensity: "normal" },
    retentionVital: healthReport.ready ? healthReport.vitals.retention : 100
  });
  console.log("Today's Plan:", todaysPlan);

  console.log("=== Engines test complete ===");
}
