import { auth, db, serverTimestamp } from '../core/firebase-app.js';
import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  collection,
  query,
  where,
  limit,
  getDocs,
  getCountFromServer,
  runTransaction,
  orderBy,
  writeBatch
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

export var EGG_TAGS = [
  'Приложение',
  'Чатбот',
  'Сайт',
  'B2C',
  'B2B',
  'Маркетплейс',
  'Инструмент',
  'Скилл',
  'Нейро',
  'другое'
];
export var SEEKING_OPTIONS = [
  { id: 'team', label: 'Команду', badge: 'ищу команду' },
  { id: 'testers', label: 'Тестеров', badge: 'ищу тестеров' },
  { id: 'feedback', label: 'Обратную связь', badge: 'ищу обратную связь' },
  { id: 'invest', label: 'Инвестиции', badge: 'ищу инвестиции' }
];

function sortByTime(items, field) {
  return items.slice().sort(function (a, b) {
    var aT = a[field] && a[field].toMillis ? a[field].toMillis() : 0;
    var bT = b[field] && b[field].toMillis ? b[field].toMillis() : 0;
    return bT - aT;
  });
}

export async function addMilestone(eggId, uid, message) {
  var trimmed = String(message || '').trim();
  if (!trimmed || trimmed.length > 200) {
    throw new Error('MILESTONE_INVALID');
  }
  var eggSnap = await getDoc(doc(db, 'eggs', eggId));
  if (!eggSnap.exists() || eggSnap.data().ownerId !== uid) {
    throw new Error('EGG_NOT_FOUND');
  }
  await addDoc(collection(db, 'egg_milestones'), {
    eggId: eggId,
    message: trimmed,
    createdAt: serverTimestamp()
  });
  await addDoc(collection(db, 'egg_updates'), {
    eggId: eggId,
    type: 'milestone',
    message: trimmed,
    createdAt: serverTimestamp()
  });
  await bumpEggHeat(eggId, 3);
}

export async function fetchMilestones(eggId) {
  var q = query(collection(db, 'egg_milestones'), where('eggId', '==', eggId), limit(50));
  var snap = await getDocs(q);
  return sortByTime(snap.docs.map(function (d) {
    return Object.assign({ id: d.id }, d.data());
  }), 'createdAt');
}

export var HATCH_FEED_MIN_VIEWS = 3;
export var HATCH_FEED_MIN_HEAT = 8;

export function hasExternalProductUrl(egg) {
  if (!egg) {
    return false;
  }
  return !!((egg.link || '').trim());
}

export function qualifiesForFeaturedHatch(egg) {
  if (!egg || egg.status === 'greetsya') {
    return false;
  }
  if (!hasExternalProductUrl(egg)) {
    return false;
  }
  if (egg.status === 'kuritsa') {
    return true;
  }
  return (egg.viewCount || 0) >= HATCH_FEED_MIN_VIEWS || (egg.heat || 0) >= HATCH_FEED_MIN_HEAT;
}

export async function changeEggStatus(eggId, uid, newStatus) {
  var allowed = ['greetsya', 'tsyplenok', 'kuritsa'];
  if (allowed.indexOf(newStatus) === -1) {
    throw new Error('STATUS_INVALID');
  }
  if (newStatus === 'kuritsa') {
    throw new Error('STATUS_ADMIN_ONLY');
  }
  var eggRef = doc(db, 'eggs', eggId);
  var snap = await getDoc(eggRef);
  if (!snap.exists() || snap.data().ownerId !== uid) {
    throw new Error('EGG_NOT_FOUND');
  }
  var eggData = snap.data();
  var oldStatus = eggData.status;
  if (oldStatus === newStatus) {
    return { changed: false, status: newStatus };
  }
  if (newStatus === 'tsyplenok') {
    if (oldStatus !== 'greetsya') {
      throw new Error('STATUS_INVALID');
    }
    if (!hasExternalProductUrl(eggData)) {
      throw new Error('HATCH_NO_URL');
    }
  }
  await updateDoc(eggRef, {
    status: newStatus,
    hatchedAt: newStatus === 'tsyplenok' ? serverTimestamp() : snap.data().hatchedAt || null,
    updatedAt: serverTimestamp()
  });
  var msg = newStatus === 'tsyplenok' ? 'Яйцо вылупилось!' : newStatus === 'kuritsa' ? 'Стало курицей!' : 'Статус обновлён';
  await addDoc(collection(db, 'egg_updates'), {
    eggId: eggId,
    type: newStatus === 'tsyplenok' ? 'hatched' : 'status',
    message: msg,
    createdAt: serverTimestamp()
  });
  if (newStatus === 'tsyplenok') {
    await awardBadge(uid, 'hatched');
  }
  await bumpEggHeat(eggId, 10);
  return { changed: true, status: newStatus, hatched: newStatus === 'tsyplenok' };
}

export async function fetchEggQuestions(eggId) {
  var q = query(collection(db, 'egg_questions'), where('eggId', '==', eggId), limit(100));
  var snap = await getDocs(q);
  return sortByTime(snap.docs.map(function (d) {
    return Object.assign({ id: d.id }, d.data());
  }), 'createdAt');
}

export async function addEggQuestion(eggId, profile, text) {
  var trimmed = String(text || '').trim();
  if (!trimmed || trimmed.length > 500) {
    throw new Error('QUESTION_INVALID');
  }
  var eggSnap = await getDoc(doc(db, 'eggs', eggId));
  if (!eggSnap.exists()) {
    throw new Error('EGG_NOT_FOUND');
  }
  if (eggSnap.data().ownerId === profile.uid) {
    throw new Error('OWN_EGG');
  }
  await addDoc(collection(db, 'egg_questions'), {
    eggId: eggId,
    authorId: profile.uid,
    authorUsername: profile.username,
    authorDisplayName: profile.displayName,
    text: trimmed,
    createdAt: serverTimestamp()
  });
  await createNotification({
    uid: eggSnap.data().ownerId,
    type: 'new_question',
    eggId: eggId,
    fromUid: profile.uid,
    text: '@' + profile.username + ' задал вопрос'
  });
  await addUserHeat(profile.uid, 2, 'question');
  await bumpEggHeat(eggId, 1);
}

export async function answerEggQuestion(questionId, eggId, uid, answerText) {
  var trimmed = String(answerText || '').trim();
  if (!trimmed || trimmed.length > 500) {
    throw new Error('ANSWER_INVALID');
  }
  var eggSnap = await getDoc(doc(db, 'eggs', eggId));
  if (!eggSnap.exists() || eggSnap.data().ownerId !== uid) {
    throw new Error('NOT_OWNER');
  }
  var qRef = doc(db, 'egg_questions', questionId);
  var qSnap = await getDoc(qRef);
  if (!qSnap.exists() || qSnap.data().eggId !== eggId) {
    throw new Error('QUESTION_NOT_FOUND');
  }
  await updateDoc(qRef, {
    answerText: trimmed,
    answeredAt: serverTimestamp()
  });
  await createNotification({
    uid: qSnap.data().authorId,
    type: 'question_answered',
    eggId: eggId,
    fromUid: uid,
    text: 'Создатель ответил на твой вопрос'
  });
  await addUserHeat(uid, 3, 'answer');
}

export async function applyAsTester(eggId, profile) {
  var testerId = eggId + '_' + profile.uid;
  var ref = doc(db, 'egg_testers', testerId);
  var snap = await getDoc(ref);
  if (snap.exists()) {
    return { already: true };
  }
  await runTransaction(db, async function (tx) {
    tx.set(ref, {
      eggId: eggId,
      uid: profile.uid,
      username: profile.username,
      status: 'applied',
      createdAt: serverTimestamp()
    });
  });
  var eggSnap = await getDoc(doc(db, 'eggs', eggId));
  if (eggSnap.exists()) {
    await createNotification({
      uid: eggSnap.data().ownerId,
      type: 'tester_signed_up',
      eggId: eggId,
      fromUid: profile.uid,
      text: '@' + profile.username + ' хочет попробовать'
    });
  }
  await bumpEggHeat(eggId, 2);
  return { already: false };
}

export async function submitTesterFeedback(eggId, uid, rating, feedback) {
  var ref = doc(db, 'egg_testers', eggId + '_' + uid);
  var snap = await getDoc(ref);
  if (!snap.exists()) {
    throw new Error('NOT_TESTER');
  }
  var r = parseInt(rating, 10);
  if (r < 1 || r > 5) {
    throw new Error('RATING_INVALID');
  }
  await updateDoc(ref, {
    status: 'feedback_sent',
    rating: r,
    feedback: String(feedback || '').trim().slice(0, 500),
    feedbackAt: serverTimestamp()
  });
  await addUserHeat(uid, 5, 'test');
  await bumpEggHeat(eggId, 3);
}

export async function fetchEggTesters(eggId) {
  var q = query(collection(db, 'egg_testers'), where('eggId', '==', eggId), limit(100));
  var snap = await getDocs(q);
  return sortByTime(snap.docs.map(function (d) {
    return Object.assign({ id: d.id }, d.data());
  }), 'createdAt');
}

export async function getTesterStats(eggId) {
  var testers = await fetchEggTesters(eggId);
  var withRating = testers.filter(function (t) {
    return t.rating;
  });
  var avg = 0;
  if (withRating.length) {
    avg = withRating.reduce(function (s, t) {
      return s + t.rating;
    }, 0) / withRating.length;
  }
  return { count: testers.length, avgRating: Math.round(avg * 10) / 10 };
}

export async function toggleFollow(followerUid, targetUid, targetUsername) {
  if (followerUid === targetUid) {
    return { following: false };
  }
  var followId = followerUid + '_' + targetUid;
  var ref = doc(db, 'follows', followId);
  var snap = await getDoc(ref);
  if (snap.exists()) {
    await deleteDoc(ref);
    return { following: false };
  }
  await runTransaction(db, async function (tx) {
    tx.set(ref, {
      followerUid: followerUid,
      targetUid: targetUid,
      targetUsername: targetUsername,
      createdAt: serverTimestamp()
    });
  });
  await createNotification({
    uid: targetUid,
    type: 'new_follower',
    fromUid: followerUid,
    text: 'Новый подписчик в инкубаторе'
  });
  return { following: true };
}

export async function isFollowing(followerUid, targetUid) {
  var snap = await getDoc(doc(db, 'follows', followerUid + '_' + targetUid));
  return snap.exists();
}

export async function fetchFollowing(uid) {
  var q = query(collection(db, 'follows'), where('followerUid', '==', uid), limit(100));
  var snap = await getDocs(q);
  return snap.docs.map(function (d) {
    return d.data();
  });
}

export async function fetchFollowerCount(targetUid) {
  if (!targetUid) {
    return 0;
  }
  var q = query(collection(db, 'follows'), where('targetUid', '==', targetUid));
  var snap = await getCountFromServer(q);
  return snap.data().count;
}

export var ACTIVITY_FEED_TYPES = ['created', 'edited', 'milestone', 'hatched', 'status'];

export async function fetchFollowedActivity(uid, limitCount) {
  var follows = await fetchFollowing(uid);
  if (!follows.length) {
    return { follows: [], events: [] };
  }

  var followedUsernames = {};
  follows.forEach(function (f) {
    followedUsernames[f.targetUid] = f.targetUsername || '';
  });

  var followedEggIds = {};
  var eggInfo = {};
  var ownerUids = Object.keys(followedUsernames);
  var i;

  for (i = 0; i < ownerUids.length; i++) {
    var ownerUid = ownerUids[i];
    var eggsQuery = query(
      collection(db, 'eggs'),
      where('ownerId', '==', ownerUid),
      where('published', '==', true),
      limit(50)
    );
    var eggsSnap = await getDocs(eggsQuery);
    eggsSnap.docs.forEach(function (d) {
      var data = d.data();
      followedEggIds[d.id] = true;
      eggInfo[d.id] = {
        title: data.title || 'Яйцо',
        ownerUsername: data.ownerUsername || followedUsernames[ownerUid]
      };
    });
  }

  if (!Object.keys(followedEggIds).length) {
    return { follows: follows, events: [] };
  }

  var updatesSnap = await getDocs(query(collection(db, 'egg_updates'), limit(200)));
  var events = updatesSnap.docs.map(function (d) {
    return Object.assign({ id: d.id }, d.data());
  }).filter(function (e) {
    return followedEggIds[e.eggId] && ACTIVITY_FEED_TYPES.indexOf(e.type) !== -1;
  }).map(function (e) {
    var info = eggInfo[e.eggId] || {};
    return Object.assign({}, e, {
      eggTitle: info.title,
      ownerUsername: info.ownerUsername
    });
  });

  return {
    follows: sortByTime(follows.map(function (f, idx) {
      return Object.assign({ id: f.followerUid + '_' + f.targetUid }, f);
    }), 'createdAt'),
    events: sortByTime(events, 'createdAt').slice(0, limitCount || 30)
  };
}

export async function createNotification(data) {
  await addDoc(collection(db, 'notifications'), {
    uid: data.uid,
    type: data.type,
    eggId: data.eggId || null,
    fromUid: data.fromUid || null,
    text: data.text,
    read: false,
    createdAt: serverTimestamp()
  });
}

export async function fetchNotifications(uid) {
  var q = query(collection(db, 'notifications'), where('uid', '==', uid), limit(50));
  var snap = await getDocs(q);
  return sortByTime(snap.docs.map(function (d) {
    return Object.assign({ id: d.id }, d.data());
  }), 'createdAt');
}

export async function markNotificationRead(notifId) {
  await updateDoc(doc(db, 'notifications', notifId), { read: true });
}

export async function markAllNotificationsRead(uid) {
  var items = await fetchNotifications(uid);
  var unread = items.filter(function (n) {
    return !n.read;
  });
  if (!unread.length) {
    return 0;
  }
  var batch = writeBatch(db);
  unread.forEach(function (n) {
    batch.update(doc(db, 'notifications', n.id), { read: true });
  });
  await batch.commit();
  return unread.length;
}

export async function countUnreadNotifications(uid) {
  var items = await fetchNotifications(uid);
  return items.filter(function (n) {
    return !n.read;
  }).length;
}

export async function expressInvestInterest(eggId, profile, message) {
  var interestId = eggId + '_' + profile.uid;
  var ref = doc(db, 'invest_interest', interestId);
  var snap = await getDoc(ref);
  if (snap.exists()) {
    return { already: true };
  }
  await runTransaction(db, async function (tx) {
    tx.set(ref, {
      eggId: eggId,
      investorUid: profile.uid,
      investorUsername: profile.username,
      message: String(message || '').trim().slice(0, 300),
      status: 'new',
      createdAt: serverTimestamp()
    });
  });
  var eggSnap = await getDoc(doc(db, 'eggs', eggId));
  if (eggSnap.exists()) {
    await createNotification({
      uid: eggSnap.data().ownerId,
      type: 'invest_interest',
      eggId: eggId,
      fromUid: profile.uid,
      text: '@' + profile.username + ' интересуется теплом'
    });
  }
  await bumpEggHeat(eggId, 5);
  return { already: false };
}

export async function fetchInvestInterest(eggId) {
  var q = query(collection(db, 'invest_interest'), where('eggId', '==', eggId), limit(50));
  var snap = await getDocs(q);
  return sortByTime(snap.docs.map(function (d) {
    return Object.assign({ id: d.id }, d.data());
  }), 'createdAt');
}

export async function hasInvestInterest(eggId, uid) {
  var snap = await getDoc(doc(db, 'invest_interest', eggId + '_' + uid));
  return snap.exists();
}

export async function addUserHeat(uid, amount, reason) {
  if (!auth.currentUser || !auth.currentUser.emailVerified) {
    return;
  }

  var userRef = doc(db, 'users', uid);
  return runTransaction(db, async function (tx) {
    var snap = await tx.get(userRef);
    if (!snap.exists()) {
      return;
    }
    var current = snap.data().heat || 0;
    tx.update(userRef, { heat: current + amount });
    tx.set(doc(collection(db, 'heat_events')), {
      uid: uid,
      amount: amount,
      reason: reason,
      createdAt: serverTimestamp()
    });
  });
}

export async function bumpEggHeat(eggId, amount) {
  var eggRef = doc(db, 'eggs', eggId);
  return runTransaction(db, async function (tx) {
    var snap = await tx.get(eggRef);
    if (!snap.exists()) {
      return;
    }
    var current = snap.data().heat || 0;
    tx.update(eggRef, { heat: current + amount });
  });
}

export var INCUBATOR_VOICE_COMMENTS = 5;

export async function countUserCommentsOnOthersEggs(uid) {
  var snap = await getDocs(query(
    collection(db, 'egg_comments'),
    where('authorId', '==', uid),
    limit(200)
  ));

  var eggOwners = {};
  var count = 0;

  for (var i = 0; i < snap.docs.length; i++) {
    var data = snap.docs[i].data();
    var eggId = data.eggId;
    if (!eggOwners.hasOwnProperty(eggId)) {
      var eggSnap = await getDoc(doc(db, 'eggs', eggId));
      eggOwners[eggId] = eggSnap.exists() ? eggSnap.data().ownerId : null;
    }
    if (eggOwners[eggId] !== uid) {
      count += 1;
    }
    if (count >= INCUBATOR_VOICE_COMMENTS) {
      break;
    }
  }

  return count;
}

/** Бейдж «Голос инкубатора» — после 5 комментариев под чужими яйцами */
export async function maybeAwardIncubatorVoiceBadge(uid) {
  var badgeRef = doc(db, 'user_badges', uid + '_first_comment');
  var existing = await getDoc(badgeRef);
  if (existing.exists()) {
    return false;
  }

  var count = await countUserCommentsOnOthersEggs(uid);
  if (count < INCUBATOR_VOICE_COMMENTS) {
    return false;
  }

  return awardBadge(uid, 'first_comment');
}

export async function awardBadge(uid, badgeId) {
  var badgeRef = doc(db, 'user_badges', uid + '_' + badgeId);
  var snap = await getDoc(badgeRef);
  if (snap.exists()) {
    return false;
  }
  await runTransaction(db, async function (tx) {
    tx.set(badgeRef, {
      uid: uid,
      badgeId: badgeId,
      earnedAt: serverTimestamp()
    });
  });
  return true;
}

export async function fetchUserBadges(uid) {
  var q = query(collection(db, 'user_badges'), where('uid', '==', uid), limit(30));
  var snap = await getDocs(q);
  return snap.docs.map(function (d) {
    return d.data();
  });
}

export var BADGE_LABELS = {
  first_comment: 'Голос инкубатора',
  laid_egg: 'Снес своё',
  hatched: 'Вылупился'
};

export async function fetchEggsFiltered(options) {
  var max = options.max || 80;
  var q = query(collection(db, 'eggs'), where('published', '==', true), limit(max));
  var snap = await getDocs(q);
  var eggs = snap.docs.map(function (d) {
    return Object.assign({ id: d.id }, d.data());
  }).filter(function (e) {
    return e.published === true;
  });

  if (options.statuses && options.statuses.length) {
    eggs = eggs.filter(function (e) {
      return options.statuses.indexOf(e.status || 'greetsya') !== -1;
    });
  } else if (options.status) {
    eggs = eggs.filter(function (e) {
      return (e.status || 'greetsya') === options.status;
    });
  }
  if (options.tag) {
    eggs = eggs.filter(function (e) {
      return e.tags && e.tags.indexOf(options.tag) !== -1;
    });
  }
  if (options.seeking) {
    eggs = eggs.filter(function (e) {
      return e.seeking && e.seeking.indexOf(options.seeking) !== -1;
    });
  }
  if (options.search) {
    var s = options.search.toLowerCase();
    eggs = eggs.filter(function (e) {
      return (e.title && e.title.toLowerCase().indexOf(s) !== -1) ||
        (e.ownerUsername && e.ownerUsername.toLowerCase().indexOf(s) !== -1);
    });
  }

  if (options.sort === 'hot') {
    eggs.sort(function (a, b) {
      return (b.heat || 0) - (a.heat || 0);
    });
  } else if (options.sort === 'hatched') {
    eggs.sort(function (a, b) {
      var aT = a.hatchedAt && a.hatchedAt.toMillis ? a.hatchedAt.toMillis() : (a.updatedAt && a.updatedAt.toMillis ? a.updatedAt.toMillis() : 0);
      var bT = b.hatchedAt && b.hatchedAt.toMillis ? b.hatchedAt.toMillis() : (b.updatedAt && b.updatedAt.toMillis ? b.updatedAt.toMillis() : 0);
      return bT - aT;
    });
  } else {
    eggs.sort(function (a, b) {
      var aT = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
      var bT = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
      return bT - aT;
    });
  }

  return eggs.slice(0, options.limit || 50);
}

export async function fetchRecentlyHatched(limitCount) {
  var eggs = await fetchEggsFiltered({ max: 100, sort: 'new' });
  return eggs.filter(qualifiesForFeaturedHatch).sort(function (a, b) {
    var aT = a.hatchedAt && a.hatchedAt.toMillis ? a.hatchedAt.toMillis() : (a.updatedAt && a.updatedAt.toMillis ? a.updatedAt.toMillis() : 0);
    var bT = b.hatchedAt && b.hatchedAt.toMillis ? b.hatchedAt.toMillis() : (b.updatedAt && b.updatedAt.toMillis ? b.updatedAt.toMillis() : 0);
    return bT - aT;
  }).slice(0, limitCount || 6);
}

export async function fetchHotEggs(limitCount) {
  return fetchEggsFiltered({ max: 80, sort: 'hot', status: 'greetsya', limit: limitCount || 6 });
}

export async function fetchIncubatingEggs(limitCount) {
  return fetchEggsFiltered({ max: 100, sort: 'new', status: 'greetsya', limit: limitCount || 50 });
}

export async function fetchChicks(limitCount) {
  return fetchEggsFiltered({ max: 100, sort: 'hatched', statuses: ['tsyplenok', 'kuritsa'], limit: limitCount || 50 });
}

export async function fetchLeaderboardUsers(limitCount) {
  var q = query(collection(db, 'users'), limit(100));
  var snap = await getDocs(q);
  return snap.docs.map(function (d) {
    return Object.assign({ uid: d.id }, d.data());
  }).sort(function (a, b) {
    return (b.heat || 0) - (a.heat || 0);
  }).slice(0, limitCount || 10);
}

export async function fetchLeaderboardEggs(limitCount) {
  return fetchEggsFiltered({ max: 100, sort: 'hot', limit: limitCount || 10 });
}
