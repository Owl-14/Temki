import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  limit,
  getDocs,
  addDoc,
  runTransaction,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import {
  normalizeUsername,
  validateUsername,
  blobToSizedDataUrl,
  MAX_AVATAR_DATA_URL_BYTES,
  MAX_EGG_DATA_URL_BYTES
} from './utils.js';

var config = window.FIREBASE_CONFIG;

if (!config || !config.apiKey) {
  throw new Error('Firebase config missing');
}

export var app = getApps().length ? getApps()[0] : initializeApp(config);
export var auth = getAuth(app);
export var db = getFirestore(app);

export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  serverTimestamp
};

export async function getUserProfile(uid) {
  var snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? Object.assign({ uid: uid }, snap.data()) : null;
}

export async function getUserByUsername(username) {
  var normalized = normalizeUsername(username);
  var usernameSnap = await getDoc(doc(db, 'usernames', normalized));

  if (!usernameSnap.exists()) {
    return null;
  }

  return getUserProfile(usernameSnap.data().uid);
}

export async function createUserProfile(uid, data) {
  var normalized = normalizeUsername(data.username);
  var error = validateUsername(normalized);

  if (error) {
    throw new Error(error);
  }

  var userRef = doc(db, 'users', uid);
  var usernameRef = doc(db, 'usernames', normalized);

  await runTransaction(db, async function (transaction) {
    var existingUsername = await transaction.get(usernameRef);

    if (existingUsername.exists()) {
      throw new Error('USERNAME_TAKEN');
    }

    transaction.set(usernameRef, {
      uid: uid,
      createdAt: serverTimestamp()
    });

    transaction.set(userRef, {
      uid: uid,
      displayName: data.displayName.trim(),
      username: normalized,
      bio: (data.bio || '').trim(),
      avatarUrl: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  });

  return getUserProfile(uid);
}

export async function updateUserProfile(uid, data, currentUsername) {
  var normalized = normalizeUsername(data.username);
  var error = validateUsername(normalized);

  if (error) {
    throw new Error(error);
  }

  var userRef = doc(db, 'users', uid);
  var newUsernameRef = doc(db, 'usernames', normalized);
  var oldUsernameRef = currentUsername ? doc(db, 'usernames', currentUsername) : null;

  if (currentUsername && currentUsername !== normalized) {
    await runTransaction(db, async function (transaction) {
      var existingUsername = await transaction.get(newUsernameRef);

      if (existingUsername.exists()) {
        throw new Error('USERNAME_TAKEN');
      }

      transaction.set(newUsernameRef, {
        uid: uid,
        createdAt: serverTimestamp()
      });

      if (oldUsernameRef) {
        transaction.delete(oldUsernameRef);
      }

      transaction.update(userRef, {
        displayName: data.displayName.trim(),
        username: normalized,
        bio: (data.bio || '').trim(),
        avatarUrl: data.avatarUrl || null,
        updatedAt: serverTimestamp()
      });
    });
  } else {
    await updateDoc(userRef, {
      displayName: data.displayName.trim(),
      username: normalized,
      bio: (data.bio || '').trim(),
      avatarUrl: data.avatarUrl || null,
      updatedAt: serverTimestamp()
    });
  }

  return getUserProfile(uid);
}

export async function uploadAvatar(uid, blob) {
  return blobToSizedDataUrl(blob, MAX_AVATAR_DATA_URL_BYTES);
}

export async function createEgg(uid, profile, data, imageBlob) {
  var imageUrl = null;

  if (imageBlob) {
    imageUrl = await blobToSizedDataUrl(imageBlob, MAX_EGG_DATA_URL_BYTES);
  }

  var eggRef = await addDoc(collection(db, 'eggs'), {
    ownerId: uid,
    ownerUsername: profile.username,
    title: data.title.trim(),
    description: data.description.trim(),
    link: data.link ? data.link.trim() : null,
    demoUrl: data.demoUrl ? data.demoUrl.trim() : null,
    imageUrl: imageUrl,
    status: 'greetsya',
    tags: data.tags || [],
    seeking: data.seeking || [],
    heat: 0,
    published: true,
    viewCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  await addDoc(collection(db, 'egg_updates'), {
    eggId: eggRef.id,
    type: 'created',
    message: 'Яйцо добавлено в инкубатор',
    createdAt: serverTimestamp()
  });

  return eggRef.id;
}

export async function updateEgg(eggId, uid, data, imageBlob) {
  var eggRef = doc(db, 'eggs', eggId);
  var snap = await getDoc(eggRef);

  if (!snap.exists() || snap.data().ownerId !== uid) {
    throw new Error('EGG_NOT_FOUND');
  }

  var updates = {
    title: data.title.trim(),
    description: data.description.trim(),
    link: data.link ? data.link.trim() : null,
    demoUrl: data.demoUrl ? data.demoUrl.trim() : null,
    tags: data.tags || [],
    seeking: data.seeking || [],
    updatedAt: serverTimestamp()
  };

  if (data.status) {
    updates.status = data.status;
  }

  if (imageBlob) {
    updates.imageUrl = await blobToSizedDataUrl(imageBlob, MAX_EGG_DATA_URL_BYTES);
  }

  await updateDoc(eggRef, updates);

  await addDoc(collection(db, 'egg_updates'), {
    eggId: eggId,
    type: 'edited',
    message: 'Описание обновлено',
    createdAt: serverTimestamp()
  });
}

export async function deleteEgg(eggId, uid) {
  var eggRef = doc(db, 'eggs', eggId);
  var snap = await getDoc(eggRef);

  if (!snap.exists() || snap.data().ownerId !== uid) {
    throw new Error('EGG_NOT_FOUND');
  }

  await deleteDoc(eggRef);
}

function sortEggs(docs) {
  return docs
    .map(function (docSnap) {
      return Object.assign({ id: docSnap.id }, docSnap.data());
    })
    .filter(function (egg) {
      return egg.published === true;
    })
    .sort(function (a, b) {
      var aTime = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
      var bTime = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
      return bTime - aTime;
    });
}

export async function fetchPublishedEggs(max, retries) {
  var attempts = retries || 3;
  var lastError = null;

  while (attempts > 0) {
    try {
      var q = query(
        collection(db, 'eggs'),
        where('published', '==', true),
        limit(max || 50)
      );

      var snap = await getDocs(q);
      return sortEggs(snap.docs).slice(0, max || 50);
    } catch (error) {
      lastError = error;
      attempts -= 1;
      if (attempts > 0) {
        await new Promise(function (resolve) {
          setTimeout(resolve, 400);
        });
      }
    }
  }

  throw lastError;
}

export async function fetchUserEggs(uid) {
  var attempts = 3;
  var lastError = null;

  while (attempts > 0) {
    try {
      var directQuery = query(
        collection(db, 'eggs'),
        where('ownerId', '==', uid),
        where('published', '==', true)
      );
      var directSnap = await getDocs(directQuery);
      return sortEggs(directSnap.docs);
    } catch (error) {
      lastError = error;

      try {
        var published = await fetchPublishedEggs(100, 2);
        var filtered = published.filter(function (egg) {
          return egg.ownerId === uid;
        });

        if (filtered.length) {
          return filtered;
        }
      } catch (fallbackError) {
        lastError = fallbackError;
      }

      attempts -= 1;
      if (attempts > 0) {
        await new Promise(function (resolve) {
          setTimeout(resolve, 400);
        });
      }
    }
  }

  throw lastError;
}

export function waitForAuth() {
  return new Promise(function (resolve) {
    var unsubscribe = onAuthStateChanged(auth, function (user) {
      unsubscribe();
      resolve(user);
    });
  });
}
