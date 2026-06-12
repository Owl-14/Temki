import { getQueryParam } from '../core/utils.js';
import { initNav } from '../core/nav.js';
import { initEggPage } from '../eggs/egg-detail.js';

var eggId = getQueryParam('id');
var eggView = document.getElementById('egg-view');
var notFound = document.getElementById('egg-not-found');
var loading = document.getElementById('egg-loading');

var elements = {
  cover: document.getElementById('egg-cover'),
  status: document.getElementById('egg-status'),
  title: document.getElementById('egg-title'),
  owner: document.getElementById('egg-owner'),
  views: document.getElementById('egg-views'),
  heat: document.getElementById('egg-heat'),
  description: document.getElementById('egg-description'),
  link: document.getElementById('egg-link'),
  tags: document.getElementById('egg-tags'),
  seeking: document.getElementById('egg-seeking'),
  stats: document.getElementById('egg-stats'),
  updates: document.getElementById('egg-updates'),
  milestones: document.getElementById('egg-milestones'),
  questions: document.getElementById('egg-questions'),
  questionGuest: document.getElementById('egg-question-guest'),
  questionOwnerHint: document.getElementById('egg-question-owner'),
  questionForm: document.getElementById('egg-question-form'),
  questionMessage: document.getElementById('egg-question-message'),
  comments: document.getElementById('egg-comments'),
  commentGuest: document.getElementById('egg-comment-guest'),
  commentForm: document.getElementById('egg-comment-form'),
  commentInput: document.getElementById('egg-comment-input'),
  commentMessage: document.getElementById('egg-comment-message'),
  ownerActions: document.getElementById('egg-owner-actions')
};

function showLoading() {
  if (loading) {
    loading.hidden = false;
  }
  if (eggView) {
    eggView.hidden = true;
  }
  if (notFound) {
    notFound.hidden = true;
  }
}

function showEgg() {
  if (loading) {
    loading.hidden = true;
  }
  if (notFound) {
    notFound.hidden = true;
  }
  if (eggView) {
    eggView.hidden = false;
  }
}

function showNotFound() {
  if (loading) {
    loading.hidden = true;
  }
  if (eggView) {
    eggView.hidden = true;
  }
  if (notFound) {
    notFound.hidden = false;
  }
}

async function loadEgg() {
  if (!eggId) {
    showNotFound();
    return;
  }

  showLoading();

  try {
    var egg = await initEggPage(eggId, elements);
    if (!egg) {
      showNotFound();
      return;
    }
    showEgg();
  } catch (error) {
    console.error('Не удалось загрузить страницу яйца:', error);
    showNotFound();
  }
}

initNav();
loadEgg();
