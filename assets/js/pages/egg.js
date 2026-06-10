import { getQueryParam } from '../core/utils.js';
import { initNav } from '../core/nav.js';
import { initEggPage } from '../eggs/egg-detail.js';

var eggId = getQueryParam('id');
var eggView = document.getElementById('egg-view');
var notFound = document.getElementById('egg-not-found');

var elements = {
  cover: document.getElementById('egg-cover'),
  status: document.getElementById('egg-status'),
  title: document.getElementById('egg-title'),
  owner: document.getElementById('egg-owner'),
  views: document.getElementById('egg-views'),
  heat: document.getElementById('egg-heat'),
  description: document.getElementById('egg-description'),
  link: document.getElementById('egg-link'),
  demo: document.getElementById('egg-demo'),
  tags: document.getElementById('egg-tags'),
  seeking: document.getElementById('egg-seeking'),
  stats: document.getElementById('egg-stats'),
  updates: document.getElementById('egg-updates'),
  milestones: document.getElementById('egg-milestones'),
  questions: document.getElementById('egg-questions'),
  questionGuest: document.getElementById('egg-question-guest'),
  questionForm: document.getElementById('egg-question-form'),
  questionMessage: document.getElementById('egg-question-message'),
  comments: document.getElementById('egg-comments'),
  commentGuest: document.getElementById('egg-comment-guest'),
  commentForm: document.getElementById('egg-comment-form'),
  commentInput: document.getElementById('egg-comment-input'),
  commentMessage: document.getElementById('egg-comment-message'),
  tryBlock: document.getElementById('egg-try-block'),
  investBlock: document.getElementById('egg-invest-block'),
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
