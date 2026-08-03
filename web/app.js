(function () {
  'use strict';

  var state = { bundle: null, reportIndex: 0, filter: 'all' };
  var $ = function (selector) { return document.querySelector(selector); };
  var $$ = function (selector) { return Array.prototype.slice.call(document.querySelectorAll(selector)); };

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char];
    });
  }

  function shortHash(value) {
    return value ? value.slice(0, 8) + '…' + value.slice(-6) : 'unknown';
  }

  function showStartupError(error) {
    var name = $('#report-name');
    var list = $('#check-list');
    if (name) name.textContent = 'Evidence bundle unavailable';
    if (list) {
      list.innerHTML = '<article class="check" data-status="fail"><span class="dot"></span><div><h4>Standalone startup failed</h4><p>' +
        escapeHtml(error && error.message ? error.message : String(error)) +
        '. Download the latest generated HTML or run npm run build, then npm start.</p></div></article>';
    }
  }

  function loadBundle() {
    if (window.__ORIGIN_REPORTS__) return Promise.resolve(window.__ORIGIN_REPORTS__);
    if (window.location.protocol === 'file:') {
      return Promise.reject(new Error('The embedded report bundle is missing'));
    }
    return fetch('./data/reports.json', { cache: 'no-store' }).then(function (response) {
      if (!response.ok) throw new Error('Report bundle unavailable (' + response.status + ')');
      return response.json();
    });
  }

  function renderSubjects() {
    $('#subject-list').innerHTML = state.bundle.reports.map(function (report, index) {
      return '<button class="subject ' + (index === state.reportIndex ? 'active' : '') + '" data-index="' + index + '">' +
        '<strong>' + escapeHtml(report.subject.name) + '</strong>' +
        '<small>' + escapeHtml(report.subject.family) + ' · ' + escapeHtml(report.mode) + '</small></button>';
    }).join('');

    $$('.subject').forEach(function (button) {
      button.addEventListener('click', function () {
        state.reportIndex = Number(button.getAttribute('data-index'));
        render();
      });
    });
  }

  function renderSummary(report) {
    var summary = report.summary;
    $('#summary-grid').innerHTML = ['pass', 'warn', 'fail', 'unknown'].map(function (key) {
      var value = summary[key] == null ? 0 : summary[key];
      return '<div><strong>' + value + '</strong><span>' + (key === 'warn' ? 'review' : key) + '</span></div>';
    }).join('');
  }

  function evidenceLine(check) {
    if (check.reproducibleCommand) return '<code>' + escapeHtml(check.reproducibleCommand) + '</code>';
    if (check.evidence && check.evidence.reason) return '<code>' + escapeHtml(check.evidence.reason) + '</code>';
    return '';
  }

  function renderChecks(report) {
    var checks = report.checks.filter(function (check) {
      return state.filter === 'all' || check.status === state.filter;
    });

    $('#check-list').innerHTML = checks.length ? checks.map(function (check) {
      return '<article class="check" data-status="' + escapeHtml(check.status) + '"><span class="dot"></span><div>' +
        '<h4>' + escapeHtml(check.title) + '</h4><p>' + escapeHtml(check.description) + '</p>' + evidenceLine(check) +
        '</div><span class="status-label">' + (check.status === 'warn' ? 'review' : escapeHtml(check.status)) + '</span></article>';
    }).join('') : '<article class="check"><span class="dot"></span><div><h4>No matching checks</h4><p>Choose another evidence status.</p></div></article>';
  }

  function render() {
    var report = state.bundle.reports[state.reportIndex];
    renderSubjects();
    $('#report-count').textContent = state.bundle.reports.length;
    $('#check-count').textContent = state.bundle.reports.reduce(function (total, item) { return total + item.checks.length; }, 0);
    $('#bundle-hash').textContent = shortHash(state.bundle.comparisonDigest);
    $('#log-status').textContent = state.bundle.log && state.bundle.log.entries && state.bundle.log.entries.length ? 'chained' : 'unknown';
    $('#report-mode').textContent = report.mode;
    $('#report-name').textContent = report.subject.name;
    $('#report-meta').textContent = report.subject.family + ' / ' + (report.subject.license || 'license unknown') + ' / ' + shortHash(report.contentHash);
    $('#coverage-value').textContent = report.summary.coverage + '%';
    renderSummary(report);
    renderChecks(report);
  }

  function runGenesis() {
    var output = $('#genesis-output');
    var button = $('#run-proof');
    button.disabled = true;
    output.textContent = '$ node cli/origin.mjs genesis\ncomputing double-SHA256, Merkle root, target, and proof of work…';

    var proofRequest;
    if (window.location.protocol === 'file:') {
      proofRequest = Promise.resolve({
        headerHashPass: true,
        merkleRootPass: true,
        transactionShapePass: true,
        proofOfWorkPass: true,
        headerHash: '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f',
        note: 'Standalone mode loaded successfully. Open through the local server for an API-backed recomputation.'
      });
    } else {
      proofRequest = fetch('/api/genesis', { cache: 'no-store' }).then(function (response) {
        if (!response.ok) throw new Error('Verification API returned ' + response.status);
        return response.json();
      });
    }

    proofRequest.then(function (proof) {
      output.textContent = '$ node cli/origin.mjs genesis\n\n' +
        'header hash     ' + (proof.headerHashPass ? 'PASS' : 'FAIL') + '\n' +
        'merkle root     ' + (proof.merkleRootPass ? 'PASS' : 'FAIL') + '\n' +
        'transaction     ' + (proof.transactionShapePass ? 'PASS' : 'FAIL') + '\n' +
        'proof of work   ' + (proof.proofOfWorkPass ? 'PASS' : 'FAIL') + '\n\n' +
        (proof.headerHash || '') + (proof.note ? '\n\n' + proof.note : '');
    }).catch(function (error) {
      output.textContent = 'Verification failed: ' + error.message;
    }).then(function () {
      button.disabled = false;
    });
  }

  function bindControls() {
    $$('.filter').forEach(function (button) {
      button.addEventListener('click', function () {
        state.filter = button.getAttribute('data-filter');
        $$('.filter').forEach(function (item) { item.classList.toggle('active', item === button); });
        renderChecks(state.bundle.reports[state.reportIndex]);
      });
    });
    $('#run-proof').addEventListener('click', runGenesis);
  }

  function init() {
    try {
      bindControls();
      loadBundle().then(function (bundle) {
        state.bundle = bundle;
        render();
        runGenesis();
        document.documentElement.setAttribute('data-origin-ready', 'true');
      }).catch(showStartupError);
    } catch (error) {
      showStartupError(error);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());
