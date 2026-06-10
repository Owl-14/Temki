import {
  db,
  serverTimestamp
} from '../firebase-app.js';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  limit,
  getDocs,
  addDoc,
  runTransaction
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

export async function getEggById(eggId) {
  var snap = await getDoc(doc(db, 'eggs', eggId));

  if (!snap.exists()) {
    return null;
  }

  return Object.assign({ id: snap.id }, snap.data());
}

export async function logEggCreated(eggId) {
  await addDoc(collection(db, 'egg_updates'), {
    eggId: eggId,
    type: 'created',
    message: 'Яйцо добавлено в инкубатор',
    createdAt: serverTimestamp()
  });
}

export async function recordEggView(eggId, user, profile) {
  if (!user || !profile || !eggId) {
    return null;
  }

  var viewId = eggId + '_' + user.uid;
  var viewRef = doc(db, 'egg_views', viewId);
  var eggRef = doc(db, 'eggs', eggId);

  return runTransaction(db, async function (transaction) {
    var viewSnap = await transaction.get(viewRef);
    var eggSnap = await transaction.get(eggRef);

    if (!eggSnap.exists()) {
      throw new Error('EGG_NOT_FOUND');
    }

    var currentCount = eggSnap.data().viewCount || 0;

    if (viewSnap.exists()) {
      return { counted: false, viewCount: currentCount };
    }

    transaction.set(viewRef, {
      eggId: eggId,
      uid: user.uid,
      username: profile.username,
      viewedAt: serverTimestamp()
    });

    transaction.update(eggRef, {
      viewCount: currentCount + 1
    });

    return { counted: true, viewCount: currentCount + 1 };
  });
}

function sortByCreatedAt(docs) {
  return docs
    .map(function (docSnap) {
      return Object.assign({ id: docSnap.id }, docSnap.data());
    })
    .sort(function (a, b) {
      var aTime = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
      var bTime = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
      return bTime - aTime;
    });
}

export async function fetchEggComments(eggId) {
  var q = query(
    collection(db, 'egg_comments'),
    where('eggId', '==', eggId),
    limit(200)
  );

  var snap = await getDocs(q);
  return sortByCreatedAt(snap.docs);
}

export async function fetchEggCommentReactions(eggId) {
  var q = query(
    collection(db, 'egg_comment_reactions'),
    where('eggId', '==', eggId),
    limit(500)
  );

  var snap = await getDocs(q);
  return snap.docs.map(function (docSnap) {
    return Object.assign({ id: docSnap.id }, docSnap.data());
  });
}

export function buildReactionStats(reactions, uid) {
  var counts = {};
  var userVotes = {};

  reactions.forEach(function (reaction) {
    if (!counts[reaction.commentId]) {
      counts[reaction.commentId] = { like: 0, dislike: 0 };
    }
    if (reaction.vote === 'like') {
      counts[reaction.commentId].like += 1;
    } else if (reaction.vote === 'dislike') {
      counts[reaction.commentId].dislike += 1;
    }
    if (uid && reaction.uid === uid) {
      userVotes[reaction.commentId] = reaction.vote;
    }
  });

  return { counts: counts, userVotes: userVotes };
}

export async function addEggComment(eggId, profile, text, replyToUsername) {
  var trimmed = String(text || '').trim();

  if (!trimmed || trimmed.length > 500) {
    throw new Error('COMMENT_INVALID');
  }

  var replyTo = replyToUsername ? String(replyToUsername).trim().toLowerCase() : null;

  if (replyTo && !/^[a-z0-9_]{3,20}$/.test(replyTo)) {
    throw new Error('REPLY_TO_INVALID');
  }

  await addDoc(collection(db, 'egg_comments'), {
    eggId: eggId,
    authorId: profile.uid,
    authorUsername: profile.username,
    authorDisplayName: profile.displayName,
    text: trimmed,
    replyToUsername: replyTo,
    createdAt: serverTimestamp()
  });
}

export async function setCommentVote(commentId, eggId, user, vote) {
  if (!user || !commentId || !eggId) {
    throw new Error('AUTH_REQUIRED');
  }

  if (vote !== 'like' && vote !== 'dislike') {
    throw new Error('VOTE_INVALID');
  }

  var reactionId = commentId + '_' + user.uid;
  var reactionRef = doc(db, 'egg_comment_reactions', reactionId);

  return runTransaction(db, async function (transaction) {
    var snap = await transaction.get(reactionRef);

    if (snap.exists()) {
      if (snap.data().vote === vote) {
        transaction.delete(reactionRef);
        return { vote: null };
      }

      transaction.update(reactionRef, { vote: vote });
      return { vote: vote };
    }

    transaction.set(reactionRef, {
      commentId: commentId,
      eggId: eggId,
      uid: user.uid,
      vote: vote,
      createdAt: serverTimestamp()
    });

    return { vote: vote };
  });
}

export async function fetchEggUpdates(eggId) {
  var q = query(
    collection(db, 'egg_updates'),
    where('eggId', '==', eggId),
    limit(50)
  );

  var snap = await getDocs(q);
  return sortByCreatedAt(snap.docs);
}

