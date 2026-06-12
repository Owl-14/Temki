import { addUserHeat } from './platform-api.js';

var QUESTS = [
  { id: 'view_3', label: 'Загляни в 3 яйца', heat: 5, key: 'views' },
  { id: 'ask_1', label: 'Задай вопрос создателю', heat: 8, key: 'questions' },
  { id: 'comment_1', label: 'Оставь комментарий', heat: 5, key: 'comments' }
];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function getDailyQuests() {
  return QUESTS;
}

function defaultQuestProgress() {
  return { views: 0, questions: 0, comments: 0, claimed: [], viewedEggIds: [] };
}

export function loadQuestProgress() {
  try {
    var raw = localStorage.getItem('incubator_quests_' + todayKey());
    if (!raw) {
      return defaultQuestProgress();
    }
    var progress = JSON.parse(raw);
    if (!Array.isArray(progress.viewedEggIds)) {
      progress.viewedEggIds = [];
    }
    return progress;
  } catch (e) {
    return defaultQuestProgress();
  }
}

function saveQuestProgress(progress) {
  localStorage.setItem('incubator_quests_' + todayKey(), JSON.stringify(progress));
}

export function trackQuestAction(actionKey) {
  var progress = loadQuestProgress();
  if (typeof progress[actionKey] === 'number') {
    progress[actionKey] += 1;
    saveQuestProgress(progress);
  }
  return progress;
}

export function trackEggViewQuest(eggId) {
  if (!eggId) {
    return loadQuestProgress();
  }

  var progress = loadQuestProgress();
  if (progress.viewedEggIds.indexOf(eggId) !== -1) {
    return progress;
  }

  progress.viewedEggIds.push(eggId);
  progress.views = progress.viewedEggIds.length;
  saveQuestProgress(progress);
  return progress;
}

export async function claimQuestReward(questId, uid) {
  var progress = loadQuestProgress();
  if (progress.claimed.indexOf(questId) !== -1) {
    return false;
  }
  var quest = QUESTS.find(function (q) {
    return q.id === questId;
  });
  if (!quest) {
    return false;
  }
  var done = (progress[quest.key] || 0) >= (quest.key === 'views' ? 3 : 1);
  if (!done) {
    return false;
  }
  progress.claimed.push(questId);
  saveQuestProgress(progress);
  await addUserHeat(uid, quest.heat, 'quest_' + questId);
  return true;
}

export function renderQuestsWidget(container, uid) {
  if (!container || !uid) {
    return;
  }
  var progress = loadQuestProgress();
  container.innerHTML = '<h3 class="quests-widget__title">Задания на сегодня</h3>' +
    QUESTS.map(function (quest) {
      var need = quest.key === 'views' ? 3 : 1;
      var cur = progress[quest.key] || 0;
      var done = cur >= need;
      var claimed = progress.claimed.indexOf(quest.id) !== -1;
      return '<div class="quests-widget__item">' +
        '<span>' + quest.label + ' (' + Math.min(cur, need) + '/' + need + ')</span>' +
        (claimed ? '<span class="quests-widget__done">✓</span>' :
          done ? '<button type="button" class="btn btn--warm btn--sm" data-quest-claim="' + quest.id + '">+' + quest.heat + ' тепла</button>' :
          '<span class="quests-widget__pending">...</span>') +
      '</div>';
    }).join('');

  container.querySelectorAll('[data-quest-claim]').forEach(function (btn) {
    btn.addEventListener('click', async function () {
      var qid = btn.getAttribute('data-quest-claim');
      var ok = await claimQuestReward(qid, uid);
      if (ok) {
        renderQuestsWidget(container, uid);
      }
    });
  });
}
