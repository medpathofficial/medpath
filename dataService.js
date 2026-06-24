/* ═══════════════════════════════════════════
   MEDPATH — DATA SERVICE
   Version: 1.0

   The only layer that writes to localStorage.
   Owns: atomic writes, rollback, rebuild logic,
         event recording, topic state maintenance,
         export/import, duplicate detection,
         phase archiving, session tracking.

   Position in architecture:
   Topic Card → Data Service → Student Data

   Rules:
   - Never bypass.
   - Never let other files write directly.
   - Raw events are truth. topicStates is cache.
═══════════════════════════════════════════ */


/* ═══════════════════════════════════════════
   SECTION 1 — CONSTANTS
═══════════════════════════════════════════ */

const STORAGE_KEYS = {
  PROFILE:                        "medpath_profile",
  SETTINGS:                       "medpath_settings",
  STUDY_EVENTS:                   "medpath_studyEvents",
  REVISION_EVENTS:                "medpath_revisionEvents",
  IMPORTED_DATA:                  "medpath_importedData",
  TOPIC_STATES:                   "medpath_topicStates",

  /* Temporary keys — not exported */
  SESSION:                        "medpath_session",
  DEFERRALS:                      "medpath_deferrals",
  LAST_HEALTH_ALERT:              "medpath_lastHealthAlert",
  LAST_RECOVERY_REMINDER:         "medpath_lastRecoveryReminder",
  LAST_CONSISTENCY_ACK:           "medpath_lastConsistencyAcknowledged",

  /* Cache key — not exported */
  CURRICULUM_CACHE:               "medpath_curriculumCache"
};

const PERMANENT_KEYS = [
  STORAGE_KEYS.PROFILE,
  STORAGE_KEYS.SETTINGS,
  STORAGE_KEYS.STUDY_EVENTS,
  STORAGE_KEYS.REVISION_EVENTS,
  STORAGE_KEYS.IMPORTED_DATA,
  STORAGE_KEYS.TOPIC_STATES
];

const ROLLING_WINDOW_SIZE = 5;
const DUPLICATE_EVENT_WINDOW_MS = 2000;
const BACKUP_VERSION = "1.0";


/* ═══════════════════════════════════════════
   SECTION 2 — LOW-LEVEL STORAGE HELPERS
═══════════════════════════════════════════ */

function safeLoad(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined) {
      return fallback;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn("Failed to load " + key, err);
    return fallback;
  }
}

function safeWrite(key, value) {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (err) {
    console.warn("Failed to write " + key, err);
    return false;
  }
}

function safeRemove(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (err) {
    return false;
  }
}


/* ═══════════════════════════════════════════
   SECTION 3 — DATE HELPERS
═══════════════════════════════════════════ */

function todayISO() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + d;
}

function nowISO() {
  return new Date().toISOString();
}

function nowTimestamp() {
  return Date.now();
}

function daysBetween(dateA, dateB) {
  if (!dateA || !dateB) return 999;
  const a = new Date(dateA);
  const b = new Date(dateB);
  const diffMs = b.getTime() - a.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}


/* ═══════════════════════════════════════════
   SECTION 4 — DEFAULT EMPTY STATES
═══════════════════════════════════════════ */

function createEmptyTopicState() {
  return {
    firstStudiedDate: null,
    lastStudiedDate: null,
    lastRevisedDate: null,
    lastRecallScore: null,
    recallHistory: [],
    lastUnderstandingScore: null,
    understandingHistory: [],
    totalRevisions: 0,
    knowledgeSource: "imported",
    archivedDate: null,
    archivedFromPhase: null
  };
}

function createDefaultSettings() {
  return {
    theme: "system",
    notifications: true,
    studyIntensity: "normal"
  };
}


/* ═══════════════════════════════════════════
   SECTION 5 — INITIALIZE APP
═══════════════════════════════════════════ */

function initializeApp() {

  const profile         = safeLoad(STORAGE_KEYS.PROFILE, null);
  const settings        = safeLoad(STORAGE_KEYS.SETTINGS, null);
  const studyEvents     = safeLoad(STORAGE_KEYS.STUDY_EVENTS, []);
  const revisionEvents  = safeLoad(STORAGE_KEYS.REVISION_EVENTS, []);
  const importedData    = safeLoad(STORAGE_KEYS.IMPORTED_DATA, []);
  let   topicStates     = safeLoad(STORAGE_KEYS.TOPIC_STATES, {});

  /* Ensure settings exist */
  if (!settings) {
    safeWrite(STORAGE_KEYS.SETTINGS, createDefaultSettings());
  }

  /* Self-healing consistency check */
  let needsWrite = false;

  for (const event of studyEvents) {
    const tid = event.topicId;
    if (!tid) continue;
    if (!topicStates[tid]) {
      topicStates[tid] = rebuildTopicState(tid, studyEvents, revisionEvents, importedData);
      needsWrite = true;
    } else if (topicStates[tid].knowledgeSource === null ||
               topicStates[tid].knowledgeSource === undefined) {
      topicStates[tid].knowledgeSource = "observed";
      needsWrite = true;
    }
  }

  for (const event of revisionEvents) {
    const tid = event.topicId;
    if (!tid) continue;
    if (!topicStates[tid]) {
      topicStates[tid] = rebuildTopicState(tid, studyEvents, revisionEvents, importedData);
      needsWrite = true;
    }
  }

  if (needsWrite) {
    safeWrite(STORAGE_KEYS.TOPIC_STATES, topicStates);
  }

  /* Update lastActiveDate */
  if (profile) {
    profile.lastActiveDate = todayISO();
    safeWrite(STORAGE_KEYS.PROFILE, profile);
  }

  return {
    profile: profile,
    settings: safeLoad(STORAGE_KEYS.SETTINGS, createDefaultSettings()),
    studyEvents: studyEvents,
    revisionEvents: revisionEvents,
    importedData: importedData,
    topicStates: topicStates
  };
}


/* ═══════════════════════════════════════════
   SECTION 6 — REBUILD TOPIC STATE
═══════════════════════════════════════════ */

function rebuildTopicState(topicId, studyEvents, revisionEvents, importedData) {

  const state = createEmptyTopicState();

  /* Sort relevant events chronologically */
  const relevantStudy = studyEvents
    .filter(function(e) { return e.topicId === topicId; })
    .sort(function(a, b) { return new Date(a.date) - new Date(b.date); });

  const relevantRevision = revisionEvents
    .filter(function(e) { return e.topicId === topicId; })
    .sort(function(a, b) { return new Date(a.date) - new Date(b.date); });

  /* Knowledge source */
  const inImported = importedData.some(function(r) { return r.topicId === topicId; });

  if (inImported && relevantStudy.length === 0 && relevantRevision.length === 0) {
    state.knowledgeSource = "imported";
  } else if (relevantStudy.length > 0 || relevantRevision.length > 0) {
    state.knowledgeSource = "observed";
  }

  /* Study event derived fields */
  if (relevantStudy.length > 0) {
    state.firstStudiedDate     = relevantStudy[0].date;
    state.lastStudiedDate      = relevantStudy[relevantStudy.length - 1].date;
    state.lastUnderstandingScore = relevantStudy[relevantStudy.length - 1].understandingScore;

    state.understandingHistory = relevantStudy
      .slice(-ROLLING_WINDOW_SIZE)
      .map(function(e) { return e.understandingScore; })
      .filter(function(v) { return v >= 1 && v <= 4; });
  }

  /* Revision event derived fields */
  if (relevantRevision.length > 0) {
    state.lastRevisedDate = relevantRevision[relevantRevision.length - 1].date;
    state.totalRevisions  = relevantRevision.length;

    const recallScores = relevantRevision
      .map(function(e) { return e.recallScoreBefore; })
      .filter(function(v) { return v >= 1 && v <= 4; });

    if (recallScores.length > 0) {
      state.lastRecallScore = recallScores[recallScores.length - 1];
      state.recallHistory   = recallScores.slice(-ROLLING_WINDOW_SIZE);
    }

    if (!state.firstStudiedDate) {
      state.firstStudiedDate = relevantRevision[0].date;
      state.lastStudiedDate  = relevantRevision[relevantRevision.length - 1].date;
    }
  }

  return state;
}


/* ═══════════════════════════════════════════
   SECTION 7 — ROLLING WINDOW UTILITY
═══════════════════════════════════════════ */

function updateRollingWindow(history, newScore) {
  const updated = history.slice();
  updated.push(newScore);
  if (updated.length > ROLLING_WINDOW_SIZE) {
    return updated.slice(updated.length - ROLLING_WINDOW_SIZE);
  }
  return updated;
}


/* ═══════════════════════════════════════════
   SECTION 8 — TIME CALCULATIONS
═══════════════════════════════════════════ */

function calculateDaysSinceLastInteraction(topicState) {

  if (!topicState) return 999;

  const lastStudied = topicState.lastStudiedDate;
  const lastRevised = topicState.lastRevisedDate;

  if (!lastStudied && !lastRevised) return 999;

  let mostRecent;
  if (!lastStudied) {
    mostRecent = lastRevised;
  } else if (!lastRevised) {
    mostRecent = lastStudied;
  } else {
    mostRecent = (new Date(lastStudied) > new Date(lastRevised))
      ? lastStudied
      : lastRevised;
  }

  return daysBetween(mostRecent, todayISO());
}


/* ═══════════════════════════════════════════
   SECTION 9 — DUPLICATE EVENT DETECTION (C3 fix)
═══════════════════════════════════════════ */

function isDuplicateEvent(topicId, events) {

  if (!events || events.length === 0) return false;

  const relevant = events.filter(function(e) { return e.topicId === topicId; });
  if (relevant.length === 0) return false;

  const last = relevant[relevant.length - 1];

  /* Compare timestamps — only safe if event date is ISO with time */
  const lastTime = new Date(last.date).getTime();
  const now = nowTimestamp();

  if (now - lastTime < DUPLICATE_EVENT_WINDOW_MS) {
    return true;
  }

  return false;
}


/* ═══════════════════════════════════════════
   SECTION 10 — SUBJECT ID LOOKUP
═══════════════════════════════════════════ */

function getSubjectIdForTopic(topicId) {

  if (typeof getCurriculumTopic !== "function") return "unknown";

  const topic = getCurriculumTopic(topicId);
  if (!topic) return "unknown";

  return topic.subjectId || "unknown";
}


/* ═══════════════════════════════════════════
   SECTION 11 — RECORD STUDY EVENT
═══════════════════════════════════════════ */

function recordStudyEvent(topicId, understandingScore) {

  /* Validate */
  if (!topicId) {
    return { success: false, error: "Missing topicId" };
  }
  if (![1, 2, 3, 4].includes(understandingScore)) {
    return { success: false, error: "Invalid understanding score" };
  }

  /* Load current events */
  const currentEvents = safeLoad(STORAGE_KEYS.STUDY_EVENTS, []);

  /* C3 duplicate guard */
  if (isDuplicateEvent(topicId, currentEvents)) {
    return { success: true, duplicate: true };
  }

  /* Build new event */
  const newEvent = {
    topicId: topicId,
    subjectId: getSubjectIdForTopic(topicId),
    date: nowISO(),
    understandingScore: understandingScore
  };

  /* Snapshot for rollback */
  const eventsBackup = currentEvents.slice();
  const updatedEvents = currentEvents.slice();
  updatedEvents.push(newEvent);

  /* Step 1: write event */
  const eventWriteOk = safeWrite(STORAGE_KEYS.STUDY_EVENTS, updatedEvents);
  if (!eventWriteOk) {
    return { success: false, error: "Could not write study event" };
  }

  /* Step 2: update topic state */
  const states = safeLoad(STORAGE_KEYS.TOPIC_STATES, {});
  const state = states[topicId] || createEmptyTopicState();

  if (!state.firstStudiedDate) {
    state.firstStudiedDate = newEvent.date;
  }
  state.lastStudiedDate          = newEvent.date;
  state.lastUnderstandingScore   = understandingScore;
  state.understandingHistory     = updateRollingWindow(
    state.understandingHistory || [], understandingScore
  );
  state.knowledgeSource          = "observed";

  states[topicId] = state;

  /* Step 3: write states */
  const stateWriteOk = safeWrite(STORAGE_KEYS.TOPIC_STATES, states);
  if (!stateWriteOk) {
    /* Rollback event write */
    safeWrite(STORAGE_KEYS.STUDY_EVENTS, eventsBackup);
    return { success: false, error: "Could not update topic state" };
  }

  return { success: true, topicState: state };
}


/* ═══════════════════════════════════════════
   SECTION 12 — RECORD REVISION EVENT
═══════════════════════════════════════════ */

function recordRevisionEvent(topicId, recallBefore, recallAfter) {

  if (!topicId) {
    return { success: false, error: "Missing topicId" };
  }
  if (recallBefore !== null && ![1, 2, 3, 4].includes(recallBefore)) {
    return { success: false, error: "Invalid recallBefore" };
  }
  if (recallAfter !== null && ![1, 2, 3, 4].includes(recallAfter)) {
    return { success: false, error: "Invalid recallAfter" };
  }

  const currentEvents = safeLoad(STORAGE_KEYS.REVISION_EVENTS, []);

  if (isDuplicateEvent(topicId, currentEvents)) {
    return { success: true, duplicate: true };
  }

  const newEvent = {
    topicId: topicId,
    subjectId: getSubjectIdForTopic(topicId),
    date: nowISO(),
    recallScoreBefore: recallBefore,
    recallScoreAfter: recallAfter
  };

  const eventsBackup = currentEvents.slice();
  const updatedEvents = currentEvents.slice();
  updatedEvents.push(newEvent);

  const eventWriteOk = safeWrite(STORAGE_KEYS.REVISION_EVENTS, updatedEvents);
  if (!eventWriteOk) {
    return { success: false, error: "Could not write revision event" };
  }

  const states = safeLoad(STORAGE_KEYS.TOPIC_STATES, {});
  const state = states[topicId] || createEmptyTopicState();

  state.lastRevisedDate = newEvent.date;
  state.totalRevisions  = (state.totalRevisions || 0) + 1;
  state.knowledgeSource = "observed";

  if (recallBefore !== null) {
    state.lastRecallScore = recallBefore;
    state.recallHistory   = updateRollingWindow(
      state.recallHistory || [], recallBefore
    );
  }

  if (!state.firstStudiedDate) {
    state.firstStudiedDate = newEvent.date;
    state.lastStudiedDate  = newEvent.date;
  }

  states[topicId] = state;

  const stateWriteOk = safeWrite(STORAGE_KEYS.TOPIC_STATES, states);
  if (!stateWriteOk) {
    safeWrite(STORAGE_KEYS.REVISION_EVENTS, eventsBackup);
    return { success: false, error: "Could not update topic state" };
  }

  return { success: true, topicState: state };
}


/* ═══════════════════════════════════════════
   SECTION 13 — RECORD IMPORTED DATA
═══════════════════════════════════════════ */

function recordImportedData(topicId, recallEstimate) {

  if (!topicId) {
    return { success: false, error: "Missing topicId" };
  }
  if (![1, 2, 3, 4].includes(recallEstimate)) {
    return { success: false, error: "Invalid recall estimate" };
  }

  /* If topic already observed — never overwrite */
  const states = safeLoad(STORAGE_KEYS.TOPIC_STATES, {});
  if (states[topicId] && states[topicId].knowledgeSource === "observed") {
    return { success: true, skipped: true };
  }

  const importedData = safeLoad(STORAGE_KEYS.IMPORTED_DATA, []);

  const newImport = {
    topicId: topicId,
    subjectId: getSubjectIdForTopic(topicId),
    importedDate: todayISO(),
    recallEstimate: recallEstimate
  };

  const updated = importedData.slice();
  const existingIndex = updated.findIndex(function(r) { return r.topicId === topicId; });

  if (existingIndex >= 0) {
    updated[existingIndex] = newImport;
  } else {
    updated.push(newImport);
  }

  const importedBackup = importedData.slice();
  const importWriteOk = safeWrite(STORAGE_KEYS.IMPORTED_DATA, updated);
  if (!importWriteOk) {
    return { success: false, error: "Could not write imported data" };
  }

  const state = states[topicId] || createEmptyTopicState();
  if (state.knowledgeSource !== "observed") {
    state.knowledgeSource = "imported";
  }
  states[topicId] = state;

  const stateWriteOk = safeWrite(STORAGE_KEYS.TOPIC_STATES, states);
  if (!stateWriteOk) {
    safeWrite(STORAGE_KEYS.IMPORTED_DATA, importedBackup);
    return { success: false, error: "Could not update topic state" };
  }

  return { success: true };
}


/* ═══════════════════════════════════════════
   SECTION 14 — PROFILE AND SETTINGS WRITES
═══════════════════════════════════════════ */

function writeProfile(profile) {
  if (!profile) return false;
  return safeWrite(STORAGE_KEYS.PROFILE, profile);
}

function writeSettings(settings) {
  if (!settings) return false;
  return safeWrite(STORAGE_KEYS.SETTINGS, settings);
}

function writeTopicStates(topicStates) {
  if (!topicStates) return false;
  return safeWrite(STORAGE_KEYS.TOPIC_STATES, topicStates);
}


/* ═══════════════════════════════════════════
   SECTION 15 — PHASE ARCHIVING (C2 fix)
═══════════════════════════════════════════ */

function archivePreviousPhaseTopics(previousPhase, newPhase) {

  if (!previousPhase || !newPhase) {
    return { success: false, archivedCount: 0 };
  }
  if (previousPhase === newPhase) {
    return { success: true, archivedCount: 0 };
  }

  if (typeof getAllTopicIdsInPhase !== "function") {
    return { success: false, archivedCount: 0 };
  }

  const previousIds = getAllTopicIdsInPhase(previousPhase);
  const newIds      = getAllTopicIdsInPhase(newPhase);
  const newIdSet    = new Set(newIds);

  const states = safeLoad(STORAGE_KEYS.TOPIC_STATES, {});
  let archivedCount = 0;

  for (const tid of previousIds) {
    if (newIdSet.has(tid)) continue;
    const st = states[tid];
    if (!st) continue;
    if (st.knowledgeSource === "archived") continue;

    st.knowledgeSource    = "archived";
    st.archivedDate       = todayISO();
    st.archivedFromPhase  = previousPhase;
    states[tid] = st;
    archivedCount += 1;
  }

  if (archivedCount > 0) {
    safeWrite(STORAGE_KEYS.TOPIC_STATES, states);
  }

  return { success: true, archivedCount: archivedCount };
}

function restoreArchivedTopics(restoredPhase) {

  if (!restoredPhase) {
    return { success: false, restoredCount: 0 };
  }

  if (typeof getAllTopicIdsInPhase !== "function") {
    return { success: false, restoredCount: 0 };
  }

  const restoredIds = getAllTopicIdsInPhase(restoredPhase);
  const states = safeLoad(STORAGE_KEYS.TOPIC_STATES, {});

  let restoredCount = 0;

  for (const tid of restoredIds) {
    const st = states[tid];
    if (!st) continue;
    if (st.knowledgeSource !== "archived") continue;
    if (st.archivedFromPhase !== restoredPhase) continue;

    st.knowledgeSource    = "observed";
    st.archivedDate       = null;
    st.archivedFromPhase  = null;
    states[tid] = st;
    restoredCount += 1;
  }

  if (restoredCount > 0) {
    safeWrite(STORAGE_KEYS.TOPIC_STATES, states);
  }

  return { success: true, restoredCount: restoredCount };
}


/* ═══════════════════════════════════════════
   SECTION 16 — SESSION TRACKING (C4 fix)
═══════════════════════════════════════════ */

function loadSession() {
  return safeLoad(STORAGE_KEYS.SESSION, null);
}

function trackCompletedTopics(topicId) {

  if (!topicId) return;

  let session = safeLoad(STORAGE_KEYS.SESSION, null);

  if (!session) {
    session = {
      date: todayISO(),
      generatedAt: nowISO(),
      planSnapshot: [],
      completedTopicIds: [],
      startedAt: null,
      lastActivityAt: null
    };
  }

  if (!session.completedTopicIds) {
    session.completedTopicIds = [];
  }

  if (session.completedTopicIds.indexOf(topicId) === -1) {
    session.completedTopicIds.push(topicId);
  }

  session.lastActivityAt = nowISO();

  if (!session.startedAt) {
    session.startedAt = nowISO();
  }

  safeWrite(STORAGE_KEYS.SESSION, session);
}

function writeSessionSnapshot(planTopics) {

  const session = {
    date: todayISO(),
    generatedAt: nowISO(),
    planSnapshot: planTopics || [],
    completedTopicIds: [],
    startedAt: null,
    lastActivityAt: null
  };

  safeWrite(STORAGE_KEYS.SESSION, session);
}

function updateSessionPlan(planTopics) {

  let session = safeLoad(STORAGE_KEYS.SESSION, null);
  if (!session) {
    writeSessionSnapshot(planTopics);
    return;
  }

  session.planSnapshot = planTopics || [];
  session.generatedAt  = nowISO();
  safeWrite(STORAGE_KEYS.SESSION, session);
}


/* ═══════════════════════════════════════════
   SECTION 17 — DEFERRALS
═══════════════════════════════════════════ */

function loadDeferrals() {
  return safeLoad(STORAGE_KEYS.DEFERRALS, {});
}

function saveDeferrals(deferrals) {
  return safeWrite(STORAGE_KEYS.DEFERRALS, deferrals || {});
}

function clearDeferralForTopic(topicId) {
  if (!topicId) return;
  const def = loadDeferrals();
  if (def[topicId]) {
    def[topicId].count = 0;
    def[topicId].nextEligibleAt = null;
    def[topicId].pausedUntil = null;
    saveDeferrals(def);
  }
}


/* ═══════════════════════════════════════════
   SECTION 18 — EXPORT / IMPORT
═══════════════════════════════════════════ */

function exportAllData() {

  const exportObject = {
    exportDate: todayISO(),
    version: BACKUP_VERSION
  };

  exportObject[STORAGE_KEYS.PROFILE]         = safeLoad(STORAGE_KEYS.PROFILE, null);
  exportObject[STORAGE_KEYS.SETTINGS]        = safeLoad(STORAGE_KEYS.SETTINGS, null);
  exportObject[STORAGE_KEYS.STUDY_EVENTS]    = safeLoad(STORAGE_KEYS.STUDY_EVENTS, []);
  exportObject[STORAGE_KEYS.REVISION_EVENTS] = safeLoad(STORAGE_KEYS.REVISION_EVENTS, []);
  exportObject[STORAGE_KEYS.IMPORTED_DATA]   = safeLoad(STORAGE_KEYS.IMPORTED_DATA, []);
  exportObject[STORAGE_KEYS.TOPIC_STATES]    = safeLoad(STORAGE_KEYS.TOPIC_STATES, {});

  const jsonString = JSON.stringify(exportObject, null, 2);
  const filename = "medpath-backup-" + todayISO() + ".json";

  triggerDownload(jsonString, filename);

  return { success: true };
}

function triggerDownload(content, filename) {
  try {
    const blob = new Blob([content], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function() {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (err) {
    console.warn("Download failed", err);
  }
}

function importAllData(jsonString) {

  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    return { success: false, error: "This backup file couldn't be read." };
  }

  for (const key of PERMANENT_KEYS) {
    if (!(key in parsed)) {
      return { success: false, error: "Incomplete backup file." };
    }
  }

  /* Snapshot current state for rollback */
  const snapshots = {};
  for (const key of PERMANENT_KEYS) {
    snapshots[key] = localStorage.getItem(key);
  }

  for (const key of PERMANENT_KEYS) {
    const ok = safeWrite(key, parsed[key]);
    if (!ok) {
      /* Rollback */
      for (const restoreKey of PERMANENT_KEYS) {
        if (snapshots[restoreKey] === null) {
          safeRemove(restoreKey);
        } else {
          try {
            localStorage.setItem(restoreKey, snapshots[restoreKey]);
          } catch (e) { /* ignore */ }
        }
      }
      return { success: false, error: "Restore failed. Your data is unchanged." };
    }
  }

  return { success: true };
}


/* ═══════════════════════════════════════════
   SECTION 19 — STORAGE SIZE WARNING
═══════════════════════════════════════════ */

function getApproxStorageUsageKB() {
  let total = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      total += (key.length + (value ? value.length : 0));
    }
  } catch (err) {
    return 0;
  }
  return Math.round(total / 1024);
}


/* ═══════════════════════════════════════════
   SECTION 20 — DEBUG / TESTING HELPERS
   These exist so we can verify Data Service
   works correctly before building engines.
═══════════════════════════════════════════ */

function testDataService() {

  console.log("=== MedPath Data Service Test ===");

  /* Clear test topic state */
  const states = safeLoad(STORAGE_KEYS.TOPIC_STATES, {});
  delete states["brachial-plexus"];
  safeWrite(STORAGE_KEYS.TOPIC_STATES, states);

  /* Step 1: Record a study event */
  const r1 = recordStudyEvent("brachial-plexus", 3);
  console.log("Study event recorded:", r1);

  /* Step 2: Read it back */
  const s1 = safeLoad(STORAGE_KEYS.TOPIC_STATES, {});
  console.log("Topic state after study:", s1["brachial-plexus"]);

  /* Step 3: Record a revision event */
  const r2 = recordRevisionEvent("brachial-plexus", 2, 3);
  console.log("Revision event recorded:", r2);

  const s2 = safeLoad(STORAGE_KEYS.TOPIC_STATES, {});
  console.log("Topic state after revision:", s2["brachial-plexus"]);

  /* Step 4: Storage usage */
  console.log("Storage used (KB):", getApproxStorageUsageKB());

  console.log("=== Test complete ===");
}
