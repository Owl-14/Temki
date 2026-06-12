import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  reload,
  deleteUser
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
  sendEmailVerification,
  reload,
  serverTimestamp
};

/** URL возврата после сброса пароля — должен быть в Authorized domains Firebase. */
export function getPasswordResetContinueUrl() {
  if (window.location.hostname === 'owl-14.github.io') {
    return 'https://owl-14.github.io/Temki/pages/auth.html';
  }
  return new URL('auth.html', window.location.href).href.split('#')[0].split('?')[0];
}

/**
 * Письмо от noreply@temki-1409.firebaseapp.com, отображаемое имя — «Инкубатор» (Firebase Templates).
 * При ошибке continue URL — повтор без actionCodeSettings (ссылка через firebaseapp.com).
 */
export async function requestPasswordReset(email) {
  var trimmed = String(email || '').trim().toLowerCase();
  if (!trimmed) {
    throw new Error('EMAIL_REQUIRED');
  }

  var actionCodeSettings = {
    url: getPasswordResetContinueUrl(),
    handleCodeInApp: false
  };

  try {
    await sendPasswordResetEmail(auth, trimmed, actionCodeSettings);
  } catch (error) {
    if (
      error.code === 'auth/unauthorized-continue-uri' ||
      error.code === 'auth/invalid-continue-uri'
    ) {
      await sendPasswordResetEmail(auth, trimmed);
      return { fallbackLink: true };
    }
    throw error;
  }

  return { fallbackLink: false };
}

/** URL после подтверждения email — тот же домен, что и для сброса пароля. */
export function getEmailVerificationContinueUrl() {
  return getPasswordResetContinueUrl();
}

/**
 * Письмо с ссылкой подтверждения email (Firebase Auth).
 * При ошибке continue URL — повтор без actionCodeSettings.
 */
export async function requestEmailVerification(user) {
  if (!user) {
    throw new Error('AUTH_REQUIRED');
  }

  var actionCodeSettings = {
    url: getEmailVerificationContinueUrl(),
    handleCodeInApp: false
  };

  try {
    await sendEmailVerification(user, actionCodeSettings);
  } catch (error) {
    if (
      error.code === 'auth/unauthorized-continue-uri' ||
      error.code === 'auth/invalid-continue-uri'
    ) {
      await sendEmailVerification(user);
      return { fallbackLink: true };
    }
    throw error;
  }

  return { fallbackLink: false };
}

export async function reloadAuthUser() {
  var user = auth.currentUser;
  if (!user) {
    return null;
  }
  await reload(user);
  return auth.currentUser;
}

/** Для входа по паролю — пока email не подтверждён, полный доступ закрыт. */
export function needsEmailVerification(user) {
  if (!user || !user.email || user.emailVerified) {
    return false;
  }
  return user.providerData.some(function (provider) {
    return provider.providerId === 'password';
  });
}

export function redirectIfUnverified(user) {
  if (needsEmailVerification(user)) {
    window.location.href = 'auth.html?verify=1';
    return true;
  }
  return false;
}

var PENDING_PROFILE_KEY = 'incubator_pending_profile';

export function savePendingProfileLocal(uid, data) {
  if (!uid) {
    return;
  }
  localStorage.setItem(
    PENDING_PROFILE_KEY,
    JSON.stringify({
      uid: uid,
      displayName: String(data.displayName || '').trim(),
      username: String(data.username || '').trim(),
      bio: String(data.bio || '').trim(),
      savedAt: Date.now()
    })
  );
}

/** @deprecated alias */
export function savePendingProfile(uid, data) {
  savePendingProfileLocal(uid, data);
  return backupPendingProfile(uid, data);
}

async function backupPendingProfile(uid, data) {
  var user = auth.currentUser;
  if (!user || user.uid !== uid) {
    return;
  }
  try {
    await setDoc(
      doc(db, 'pending_profiles', uid),
      {
        uid: uid,
        displayName: String(data.displayName || '').trim(),
        username: String(data.username || '').trim(),
        bio: String(data.bio || '').trim(),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('pending profile backup failed', error);
  }
}

export function getPendingProfile(uid) {
  try {
    var raw = localStorage.getItem(PENDING_PROFILE_KEY);
    if (!raw) {
      return null;
    }
    var parsed = JSON.parse(raw);
    if (!parsed || parsed.uid !== uid) {
      return null;
    }
    return parsed;
  } catch (error) {
    return null;
  }
}

/** localStorage, затем Firestore `pending_profiles/{uid}` */
export async function fetchPendingProfile(uid) {
  var local = getPendingProfile(uid);
  if (local) {
    return local;
  }
  try {
    var snap = await getDoc(doc(db, 'pending_profiles', uid));
    if (!snap.exists()) {
      return null;
    }
    var data = snap.data();
    return {
      uid: uid,
      displayName: String(data.displayName || '').trim(),
      username: String(data.username || '').trim(),
      bio: String(data.bio || '').trim()
    };
  } catch (error) {
    console.warn('fetchPendingProfile failed', error);
    return null;
  }
}

export function clearPendingProfile(uid) {
  localStorage.removeItem(PENDING_PROFILE_KEY);
  if (uid) {
    deleteDoc(doc(db, 'pending_profiles', uid)).catch(function () {});
  }
}

/**
 * Профиль Firestore создаётся только после emailVerified.
 * Данные регистрации хранятся в localStorage до подтверждения.
 */
export async function finalizePendingProfile(user) {
  if (!user || needsEmailVerification(user)) {
    return null;
  }

  // Rules смотрят email_verified в JWT — после verify нужен свежий токен
  await user.getIdToken(true);

  var existing = await getUserProfile(user.uid);
  if (existing) {
    clearPendingProfile(user.uid);
    return existing;
  }

  var pending = await fetchPendingProfile(user.uid);
  if (!pending) {
    return null;
  }

  var profile = await createUserProfile(user.uid, {
    displayName: pending.displayName,
    username: pending.username,
    bio: pending.bio
  });
  clearPendingProfile(user.uid);
  return profile;
}

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

async function deleteDocsFromQuery(q) {
  var snap = await getDocs(q);
  if (!snap.empty) {
    await Promise.all(snap.docs.map(function (docSnap) {
      return deleteDoc(docSnap.ref);
    }));
  }
}

/**
 * Удаляет профиль Firestore, яйца пользователя, подписки (исходящие), уведомления и Auth-аккаунт.
 */
export async function deleteUserAccount(user) {
  if (!user) {
    throw new Error('AUTH_REQUIRED');
  }

  await user.getIdToken(true);

  var uid = user.uid;
  var profile = await getUserProfile(uid);

  var eggsSnap = await getDocs(query(collection(db, 'eggs'), where('ownerId', '==', uid)));
  await Promise.all(eggsSnap.docs.map(function (docSnap) {
    return deleteDoc(docSnap.ref);
  }));

  await deleteDocsFromQuery(query(collection(db, 'follows'), where('followerUid', '==', uid)));
  await deleteDocsFromQuery(query(collection(db, 'notifications'), where('uid', '==', uid)));

  var badgesSnap = await getDocs(query(collection(db, 'user_badges'), limit(500)));
  var badgePrefix = uid + '_';
  await Promise.all(badgesSnap.docs.filter(function (docSnap) {
    return docSnap.id.indexOf(badgePrefix) === 0;
  }).map(function (docSnap) {
    return deleteDoc(docSnap.ref);
  }));

  clearPendingProfile(uid);

  if (profile && profile.username) {
    await deleteDoc(doc(db, 'usernames', profile.username));
  }

  await deleteDoc(doc(db, 'users', uid));
  await deleteUser(user);
}

export function waitForAuth() {
  return new Promise(function (resolve) {
    var unsubscribe = onAuthStateChanged(auth, function (user) {
      unsubscribe();
      resolve(user);
    });
  });
}
