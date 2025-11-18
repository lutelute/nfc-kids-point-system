/**
 * NFC キッズポイントシステム - Google Apps Script
 * 
 * 子供向けNFCポイント管理システムのバックエンド処理
 * 
 * 機能:
 * - NFCタグデータの受信・保存
 * - リアルタイムダッシュボードの生成
 * - ユーザー別詳細統計の表示
 * - レスポンシブWebUI
 * 
 * @author あなたの名前
 * @version 1.0.0
 * @license MIT
 */

/**
 * GETリクエストのハンドラ
 * ダッシュボード表示とユーザー詳細表示を処理
 * 
 * @param {Object} e - リクエストオブジェクト
 * @returns {HtmlOutput} HTMLレスポンス
 */
function doGet(e) {
  const action = e.parameter.action;
  const user = e.parameter.user;
  
  if (action === 'dashboard') {
    if (user) {
      return createUserDetail(user);
    }
    return createDashboard();
  }
  
  return ContentService.createTextOutput('NFC Logger API is running');
}

/**
 * POSTリクエストのハンドラ
 * NFCタグデータの受信・保存処理
 * 
 * @param {Object} e - リクエストオブジェクト
 * @returns {TextOutput} JSON形式のレスポンス
 */
function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const timestamp = new Date();
    
    const rawData = JSON.parse(e.postData.contents);
    
    // デフォルト値の設定
    let nfcId = 'unknown';
    let tagName = 'unknown';
    let points = 1;
    
    // データの解析（二重JSON対応）
    const keys = Object.keys(rawData);
    if (keys.length > 0) {
      try {
        const innerData = JSON.parse(keys[0]);
        nfcId = innerData.nfcId || 'unknown';
        tagName = innerData.tagName || 'unknown';
        points = parseInt(innerData.points) || 1;
      } catch (e) {
        nfcId = rawData.nfcId || 'unknown';
        tagName = rawData.tagName || 'unknown';
        points = parseInt(rawData.points) || 1;
      }
    }
    
    // シート取得または作成
    let sheet = ss.getSheetByName(tagName);
    if (!sheet) {
      sheet = ss.insertSheet(tagName);
      // ヘッダー行の設定
      sheet.appendRow(['タイムスタンプ', 'NFC ID', 'タグ名', 'ポイント']);
      sheet.getRange(1, 1, 1, 4).setFontWeight('bold');
    }
    
    // データの記録
    sheet.appendRow([
      Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'),
      nfcId,
      tagName,
      points
    ]);
    
    // 成功レスポンス
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      nfcId: nfcId,
      tagName: tagName,
      points: points
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // エラーレスポンス
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * メインダッシュボードの生成
 * 全ユーザーの統計とグラフを表示
 * 
 * @returns {HtmlOutput} ダッシュボードHTML
 */
function createDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  
  // 日付計算
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayStr = today.toLocaleDateString('ja-JP');
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const chartData = [];
  
  // 各ユーザーシートの統計計算
  sheets.forEach(function(sheet) {
    const sheetName = sheet.getName();
    // システムシートをスキップ
    if (sheetName === 'DEBUG' || sheetName === 'RESULT' || sheetName === 'Sheet1' || sheetName === 'DEBUG_POINTS') return;
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return; // ヘッダーのみの場合はスキップ
    
    // 統計変数の初期化
    const dates = {};
    let totalCount = 0;
    let totalPoints = 0;
    let todayCount = 0;
    let todayPoints = 0;
    let yesterdayCount = 0;
    let yesterdayPoints = 0;
    let threeDaysCount = 0;
    let threeDaysPoints = 0;
    let weekCount = 0;
    let weekPoints = 0;
    
    // データの集計
    for (let i = 1; i < data.length; i++) {
      const recordDate = new Date(data[i][0]);
      const dateStr = recordDate.toLocaleDateString('ja-JP');
      const points = parseInt(data[i][3]) || 1;
      
      dates[dateStr] = (dates[dateStr] || 0) + points;
      totalCount++;
      totalPoints += points;
      
      // 期間別集計
      if (recordDate >= today) {
        todayCount++;
        todayPoints += points;
      }
      if (recordDate >= yesterday && recordDate < today) {
        yesterdayCount++;
        yesterdayPoints += points;
      }
      if (recordDate >= threeDaysAgo) {
        threeDaysCount++;
        threeDaysPoints += points;
      }
      if (recordDate >= weekAgo) {
        weekCount++;
        weekPoints += points;
      }
    }
    
    chartData.push({
      name: sheetName,
      dates: dates,
      total: totalCount,
      totalPoints: totalPoints,
      today: todayCount,
      todayPoints: todayPoints,
      yesterday: yesterdayCount,
      yesterdayPoints: yesterdayPoints,
      threeDays: threeDaysCount,
      threeDaysPoints: threeDaysPoints,
      week: weekCount,
      weekPoints: weekPoints,
      nfcId: data[1][1] || 'unknown'
    });
  });
  
  // 全体統計の計算
  const totalAll = chartData.reduce(function(sum, tag) { return sum + tag.total; }, 0);
  const totalPointsAll = chartData.reduce(function(sum, tag) { return sum + tag.totalPoints; }, 0);
  const todayAll = chartData.reduce(function(sum, tag) { return sum + tag.today; }, 0);
  const todayPointsAll = chartData.reduce(function(sum, tag) { return sum + tag.todayPoints; }, 0);
  const yesterdayAll = chartData.reduce(function(sum, tag) { return sum + tag.yesterday; }, 0);
  const yesterdayPointsAll = chartData.reduce(function(sum, tag) { return sum + tag.yesterdayPoints; }, 0);
  const threeDaysAll = chartData.reduce(function(sum, tag) { return sum + tag.threeDays; }, 0);
  const threeDaysPointsAll = chartData.reduce(function(sum, tag) { return sum + tag.threeDaysPoints; }, 0);
  const weekAll = chartData.reduce(function(sum, tag) { return sum + tag.week; }, 0);
  const weekPointsAll = chartData.reduce(function(sum, tag) { return sum + tag.weekPoints; }, 0);
  
  // HTML生成（最適化済み）
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>NFC記録ダッシュボード</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;padding:20px;background:#f5f5f5;margin:0}
h1{text-align:center;color:#333;margin-bottom:10px}
.header-section{text-align:center;margin-bottom:30px}
.refresh-btn{background:#4285f4;color:white;border:none;padding:12px 24px;border-radius:6px;font-size:1em;cursor:pointer;box-shadow:0 2px 4px rgba(0,0,0,0.2);transition:background 0.3s}
.refresh-btn:hover{background:#3367d6}
.last-updated{color:#666;font-size:0.9em;margin-top:10px}
.summary-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:15px;max-width:1200px;margin:0 auto 30px}
.stat-box{background:white;padding:20px;border-radius:8px;text-align:center;box-shadow:0 2px 4px rgba(0,0,0,0.1)}
.stat-number{font-size:2.5em;font-weight:bold;color:#4285f4;margin-bottom:5px}
.stat-number.today{color:#ff6b6b}
.stat-number.yesterday{color:#ffa726}
.stat-label{color:#666;font-size:0.9em}
.stat-sublabel{color:#999;font-size:0.75em;margin-top:3px}
.user-section{background:white;border-radius:8px;padding:25px;margin:20px auto;max-width:1200px;box-shadow:0 2px 4px rgba(0,0,0,0.1);cursor:pointer;transition:transform 0.2s,box-shadow 0.2s}
.user-section:hover{transform:translateY(-2px);box-shadow:0 4px 8px rgba(0,0,0,0.15)}
.user-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:10px}
.user-name{font-size:1.5em;font-weight:bold;color:#333}
.user-stats{display:flex;gap:20px;flex-wrap:wrap}
.user-stat{text-align:center;padding:10px;background:#f8f9fa;border-radius:6px;min-width:90px}
.user-stat-number{font-size:1.3em;font-weight:bold;color:#4285f4}
.user-stat-number.today{color:#ff6b6b}
.user-stat-number.yesterday{color:#ffa726}
.user-stat-label{font-size:0.8em;color:#666;margin-top:3px}
.chart-wrapper{margin-top:20px;min-height:200px}
.loading{color:#999;text-align:center;padding:20px}
</style>
</head>
<body>
<div class="header-section">
<h1>📊 NFC記録ダッシュボード</h1>
<button class="refresh-btn" onclick="refreshPage()">🔄 更新</button>
<div class="last-updated">最終更新: ${now.toLocaleString('ja-JP')}</div>
</div>

<div class="summary-stats">
<div class="stat-box"><div class="stat-number">${chartData.length}</div><div class="stat-label">登録ユーザー数</div></div>
<div class="stat-box"><div class="stat-number">${totalPointsAll}</div><div class="stat-label">総ポイント</div><div class="stat-sublabel">${totalAll}回</div></div>
<div class="stat-box"><div class="stat-number today">${todayPointsAll}</div><div class="stat-label">本日</div><div class="stat-sublabel">${todayAll}回</div></div>
<div class="stat-box"><div class="stat-number yesterday">${yesterdayPointsAll}</div><div class="stat-label">昨日</div><div class="stat-sublabel">${yesterdayAll}回</div></div>
<div class="stat-box"><div class="stat-number">${threeDaysPointsAll}</div><div class="stat-label">3日間</div><div class="stat-sublabel">${threeDaysAll}回</div></div>
<div class="stat-box"><div class="stat-number">${weekPointsAll}</div><div class="stat-label">今週</div><div class="stat-sublabel">${weekAll}回</div></div>
</div>

${chartData.map(function(tag, i) {
  const chartId = 'chart_' + i;
  const detailUrl = '?action=dashboard&user=' + encodeURIComponent(tag.name);
  return `
<div class="user-section" onclick="location.href='${detailUrl}'">
<div class="user-header">
<div class="user-name">${tag.name} 👉</div>
<div class="user-stats">
<div class="user-stat"><div class="user-stat-number">${tag.totalPoints}</div><div class="user-stat-label">総ポイント</div><div class="stat-sublabel">${tag.total}回</div></div>
<div class="user-stat"><div class="user-stat-number today">${tag.todayPoints}</div><div class="user-stat-label">本日</div><div class="stat-sublabel">${tag.today}回</div></div>
<div class="user-stat"><div class="user-stat-number yesterday">${tag.yesterdayPoints}</div><div class="user-stat-label">昨日</div><div class="stat-sublabel">${tag.yesterday}回</div></div>
<div class="user-stat"><div class="user-stat-number">${tag.threeDaysPoints}</div><div class="user-stat-label">3日間</div><div class="stat-sublabel">${tag.threeDays}回</div></div>
<div class="user-stat"><div class="user-stat-number">${tag.weekPoints}</div><div class="user-stat-label">今週</div><div class="stat-sublabel">${tag.week}回</div></div>
</div>
</div>
<div class="chart-wrapper" data-chart-index="${i}">
<div class="loading">チャートを読み込み中...</div>
<canvas id="${chartId}" style="display:none"></canvas>
</div>
</div>`;
}).join('')}

<script>
const todayDate = "${todayStr}";
const chartDataArray = ${JSON.stringify(chartData)};
const charts = new Map();

// 更新ボタンの処理
function refreshPage() {
  const currentUrl = window.location.href.split('?')[0];
  window.location.href = currentUrl + '?action=dashboard&t=' + new Date().getTime();
}

// Intersection Observerで遅延読み込み
const observerOptions = {
  root: null,
  rootMargin: '100px',
  threshold: 0.1
};

function createChart(index) {
  if (charts.has(index)) return;
  
  const chartId = 'chart_' + index;
  const canvas = document.getElementById(chartId);
  const wrapper = canvas.parentElement;
  
  if (!canvas) return;
  
  const tag = chartDataArray[index];
  const labels = Object.keys(tag.dates);
  const data = Object.values(tag.dates);
  const bgColors = labels.map(label => 
    label === todayDate ? 'rgba(255,107,107,0.3)' : 'rgba(66,133,244,0.1)'
  );
  
  canvas.style.display = 'block';
  wrapper.querySelector('.loading').style.display = 'none';
  
  const chart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'ポイント',
        data: data,
        borderColor: 'rgb(66,133,244)',
        backgroundColor: bgColors,
        tension: 0.3,
        fill: true,
        pointRadius: function(context) {
          return context.parsed.x === labels.indexOf(todayDate) ? 8 : 3;
        },
        pointBackgroundColor: function(context) {
          return context.parsed.x === labels.indexOf(todayDate) ? '#ff6b6b' : 'rgb(66,133,244)';
        }
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: function(context) {
              return context[0].label + (context[0].label === todayDate ? ' (今日)' : '');
            },
            label: function(context) {
              return context.parsed.y + ' pt';
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            callback: function(value, index) {
              const label = labels[index];
              return label === todayDate ? label + ' ★' : label;
            },
            color: function(context) {
              return labels[context.index] === todayDate ? '#ff6b6b' : '#666';
            }
          }
        },
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 }
        }
      }
    }
  });
  
  charts.set(index, chart);
}

const observer = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      const index = parseInt(entry.target.dataset.chartIndex);
      createChart(index);
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// 全チャートラッパーを監視
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.chart-wrapper').forEach(function(wrapper) {
    observer.observe(wrapper);
  });
});
</script>
</body>
</html>`;
  
  return HtmlService.createHtmlOutput(html);
}

/**
 * ユーザー詳細ページの生成
 * 個別ユーザーの詳細統計とグラフを表示
 * 
 * @param {string} userName - ユーザー名
 * @returns {HtmlOutput} ユーザー詳細HTML
 */
function createUserDetail(userName) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(userName);
    
    if (!sheet) {
      return HtmlService.createHtmlOutput('<html><body style="padding:40px;font-family:Arial"><h1>ユーザーが見つかりません: ' + userName + '</h1><a href="?action=dashboard" style="color:#4285f4">← ダッシュボードに戻る</a></body></html>');
    }
    
    const data = sheet.getDataRange().getValues();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayStr = today.toLocaleDateString('ja-JP');
    
    // 分析用データ構造の初期化
    const hourlyData = {};
    const weekdayData = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0};
    const dailyData = {};
    const records = [];
    let totalPoints = 0;
    
    // データ分析
    for (let i = 1; i < data.length; i++) {
      const recordDate = new Date(data[i][0]);
      const hour = recordDate.getHours();
      const weekday = recordDate.getDay();
      const dateStr = recordDate.toLocaleDateString('ja-JP');
      const points = parseInt(data[i][3]) || 1;
      
      // 時間別集計
      hourlyData[hour] = (hourlyData[hour] || 0) + points;
      // 曜日別集計
      weekdayData[weekday] += points;
      // 日別集計
      dailyData[dateStr] = (dailyData[dateStr] || 0) + points;
      totalPoints += points;
      
      // 記録履歴
      records.push({
        timestamp: Utilities.formatDate(recordDate, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'),
        nfcId: data[i][1],
        tagName: data[i][2],
        points: points
      });
    }
    
    // グラフデータの準備
    const weekdayLabels = ['日', '月', '火', '水', '木', '金', '土'];
    const weekdayValues = [0, 1, 2, 3, 4, 5, 6].map(function(d) { return weekdayData[d]; });
    
    const hours = [];
    const hourValues = [];
    for (let h = 0; h < 24; h++) {
      hours.push(h + '時');
      hourValues.push(hourlyData[h] || 0);
    }
    
    const dailyLabels = Object.keys(dailyData);
    const dailyValues = Object.values(dailyData);
    
    // 記録履歴テーブルの生成
    const recordsHtml = records.slice(-20).reverse().map(function(rec) {
      return '<tr><td>' + rec.timestamp + '</td><td>' + rec.tagName + '</td><td class="points-cell">' + rec.points + ' pt</td></tr>';
    }).join('');
    
    // ユーザー詳細HTML
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${userName} - 詳細</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;padding:20px;background:#f5f5f5;margin:0}
.header{text-align:center;margin-bottom:30px}
h1{color:#333;margin-bottom:10px}
.total-points{font-size:2em;color:#ff6b6b;font-weight:bold;margin:10px 0}
.back-btn{background:#666;color:white;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;margin:10px;text-decoration:none;display:inline-block}
.back-btn:hover{background:#555}
.refresh-btn{background:#4285f4;color:white;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;margin:10px;text-decoration:none;display:inline-block}
.refresh-btn:hover{background:#3367d6}
.chart-section{background:white;border-radius:8px;padding:25px;margin:20px auto;max-width:1000px;box-shadow:0 2px 4px rgba(0,0,0,0.1)}
.chart-title{font-size:1.3em;font-weight:bold;color:#333;margin-bottom:15px}
.records-table{width:100%;border-collapse:collapse;margin-top:15px}
.records-table th{background:#4285f4;color:white;padding:12px;text-align:left}
.records-table td{padding:10px;border-bottom:1px solid #ddd}
.records-table tr:hover{background:#f5f5f5}
.points-cell{color:#ff6b6b;font-weight:bold}
</style>
</head>
<body>
<div class="header">
<h1>📋 ${userName} の詳細記録</h1>
<div class="total-points">総ポイント: ${totalPoints} pt</div>
<p style="color:#666">記録回数: ${data.length - 1}回</p>
<a href="?action=dashboard" class="back-btn">← ダッシュボードに戻る</a>
<button class="refresh-btn" onclick="refreshPage()">🔄 更新</button>
</div>

<div class="chart-section">
<div class="chart-title">📅 日別ポイント</div>
<canvas id="dailyChart"></canvas>
</div>

<div class="chart-section">
<div class="chart-title">🕐 時間帯別ポイント</div>
<canvas id="hourlyChart"></canvas>
</div>

<div class="chart-section">
<div class="chart-title">📆 曜日別ポイント</div>
<canvas id="weekdayChart"></canvas>
</div>

<div class="chart-section">
<div class="chart-title">📝 記録履歴（最新20件）</div>
<table class="records-table">
<tr><th>タイムスタンプ</th><th>タグ名</th><th>ポイント</th></tr>
${recordsHtml}
</table>
</div>

<script>
const todayDate = "${todayStr}";

function refreshPage() {
  const baseUrl = window.location.href.split('?')[0];
  const userName = "${userName}";
  window.location.href = baseUrl + '?action=dashboard&user=' + encodeURIComponent(userName) + '&t=' + new Date().getTime();
}

window.addEventListener('DOMContentLoaded', function() {
  const dailyLabels = ${JSON.stringify(dailyLabels)};
  const dailyData = ${JSON.stringify(dailyValues)};
  const dailyBgColors = dailyLabels.map(label => 
    label === todayDate ? 'rgba(255,107,107,0.3)' : 'rgba(66,133,244,0.1)'
  );
  
  // 日別ポイントチャート
  new Chart(document.getElementById('dailyChart'), {
    type: 'line',
    data: {
      labels: dailyLabels,
      datasets: [{
        label: 'ポイント',
        data: dailyData,
        borderColor: 'rgb(66,133,244)',
        backgroundColor: dailyBgColors,
        tension: 0.3,
        fill: true,
        pointRadius: function(context) {
          return context.parsed.x === dailyLabels.indexOf(todayDate) ? 8 : 3;
        },
        pointBackgroundColor: function(context) {
          return context.parsed.x === dailyLabels.indexOf(todayDate) ? '#ff6b6b' : 'rgb(66,133,244)';
        }
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: function(context) {
              return context[0].label + (context[0].label === todayDate ? ' (今日)' : '');
            },
            label: function(context) {
              return context.parsed.y + ' pt';
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            callback: function(value, index) {
              const label = dailyLabels[index];
              return label === todayDate ? label + ' ★' : label;
            },
            color: function(context) {
              return dailyLabels[context.index] === todayDate ? '#ff6b6b' : '#666';
            }
          }
        },
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 }
        }
      }
    }
  });
  
  // 時間帯別ポイントチャート
  new Chart(document.getElementById('hourlyChart'), {
    type: 'bar',
    data: {
      labels: ${JSON.stringify(hours)},
      datasets: [{
        label: 'ポイント',
        data: ${JSON.stringify(hourValues)},
        backgroundColor: 'rgba(66,133,244,0.7)'
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 }
        }
      }
    }
  });
  
  // 曜日別ポイントチャート
  new Chart(document.getElementById('weekdayChart'), {
    type: 'bar',
    data: {
      labels: ${JSON.stringify(weekdayLabels)},
      datasets: [{
        label: 'ポイント',
        data: ${JSON.stringify(weekdayValues)},
        backgroundColor: 'rgba(255,107,107,0.7)'
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 }
        }
      }
    }
  });
});
</script>
</body>
</html>`;
    
    return HtmlService.createHtmlOutput(html);
    
  } catch (error) {
    return HtmlService.createHtmlOutput('<html><body style="padding:40px"><h1>エラーが発生しました</h1><p>' + error.toString() + '</p><a href="?action=dashboard" style="color:#4285f4">← 戻る</a></body></html>');
  }
}