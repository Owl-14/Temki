import { getQueryParam } from '../utils.js';
import { initNav } from '../nav.js';
import { initEggPage } from '../egg/egg-detail.js';

var eggId = getQueryParam('id');
var eggView = document.getElementById('egg-view');
var notFound = document.getElementById('egg-not-found');

var elements = {
  cover: document.getElementById('egg-cover'),
  status: document.getElementById('egg-status'),
  title: document.getElementById('egg-title'),
  owner: document.getElementById('egg-owner'),
  views: document.getElementById('egg-views'),
  description: document.getElementById('egg-description'),
  link: document.getElementById('egg-link'),
  updates: document.getElementById('egg-updates'),
  comments: document.getElementById('egg-comments'),
  commentGuest: document.getElementById('egg-comment-guest'),
  commentForm: document.getElementById('egg-comment-form'),
  commentInput: document.getElementById('egg-comment-input'),
  commentMessage: document.getElementById('egg-comment-message'),
  ownerActions: document.getElementById('egg-owner-actions')
};

async function loadEgg() {
  if (!eggId) {
    eggView.hidden = true;
    notFound.hidden = false;
    return;
  }

  var egg = await initEggPage(eggId, elements);

  if (!egg) {
    eggView.hidden = true;
    notFound.hidden = false;
    return;
  }

  notFound.hidden = true;
  eggView.hidden = false;
}

loadEgg().catch(function () {
  eggView.hidden = true;
  notFound.hidden = false;
});

initNav();
