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

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const timestamp = new Date();
    
    const rawData = JSON.parse(e.postData.contents);
    
    let nfcId = 'unknown';
    let tagName = 'unknown';
    let points = 1;
    
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
    
    let sheet = ss.getSheetByName(tagName);
    if (!sheet) {
      sheet = ss.insertSheet(tagName);
      sheet.appendRow(['タイムスタンプ', 'NFC ID', 'タグ名', 'ポイント']);
      sheet.getRange(1, 1, 1, 4).setFontWeight('bold');
    }
    
    sheet.appendRow([
      Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'),
      nfcId,
      tagName,
      points
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      nfcId: nfcId,
      tagName: tagName,
      points: points
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function createDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayStr = today.toLocaleDateString('ja-JP');
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const chartData = [];
  
  sheets.forEach(function(sheet) {
    const sheetName = sheet.getName();
    if (sheetName === 'DEBUG' || sheetName === 'RESULT' || sheetName === 'Sheet1' || sheetName === 'DEBUG_POINTS') return;
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return;
    
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
    
    for (let i = 1; i < data.length; i++) {
      const recordDate = new Date(data[i][0]);
      const dateStr = recordDate.toLocaleDateString('ja-JP');
      const points = parseInt(data[i][3]) || 1;
      
      dates[dateStr] = (dates[dateStr] || 0) + points;
      totalCount++;
      totalPoints += points;
      
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
  
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>NFC記録ダッシュボード</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<style>
* {
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 0;
  min-height: 100vh;
}

.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
}

h1 {
  text-align: center;
  color: white;
  margin-bottom: 10px;
  font-size: 2.5em;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
}

.header-section {
  text-align: center;
  margin-bottom: 30px;
}

.refresh-btn {
  background: white;
  color: #667eea;
  border: none;
  padding: 12px 30px;
  border-radius: 25px;
  font-size: 1em;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  transition: all 0.3s;
}

.refresh-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.3);
}

.last-updated {
  color: white;
  font-size: 0.9em;
  margin-top: 10px;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
}

/* サマリー統計 */
.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
}

.stat-box {
  background: white;
  padding: 20px;
  border-radius: 15px;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}

.stat-box:hover {
  transform: translateY(-5px);
}

.stat-number {
  font-size: 2.5em;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 5px;
}

.stat-number.today {
  color: #ff6b6b;
}

.stat-number.yesterday {
  color: #ffa726;
}

.stat-label {
  color: #666;
  font-size: 0.9em;
  font-weight: 600;
}

.stat-sublabel {
  color: #999;
  font-size: 0.75em;
  margin-top: 3px;
}

/* ユーザータイルグリッド */
.user-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .user-grid {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 769px) and (max-width: 1200px) {
  .user-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.user-tile {
  background: white;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
}

.user-tile:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.2);
}

.user-tile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
}

.user-name {
  font-size: 1.4em;
  font-weight: bold;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-arrow {
  font-size: 1.2em;
  color: #667eea;
}

/* 統計ミニグリッド */
.mini-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 15px;
}

.mini-stat {
  text-align: center;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
}

.mini-stat-number {
  font-size: 1.5em;
  font-weight: bold;
  color: #667eea;
}

.mini-stat-number.today {
  color: #ff6b6b;
}

.mini-stat-number.yesterday {
  color: #ffa726;
}

.mini-stat-label {
  font-size: 0.75em;
  color: #666;
  margin-top: 3px;
  font-weight: 600;
}

.mini-stat-sublabel {
  font-size: 0.7em;
  color: #999;
}

/* チャートエリア */
.chart-area {
  margin-top: 10px;
  min-height: 180px;
  position: relative;
}

.loading {
  color: #999;
  text-align: center;
  padding: 60px 20px;
  font-size: 0.9em;
}

canvas {
  max-height: 180px;
}
</style>
</head>
<body>
<div class="dashboard-container">
  <div class="header-section">
    <h1>📊 NFC記録ダッシュボード</h1>
    <button class="refresh-btn" onclick="refreshPage()">🔄 更新</button>
    <div class="last-updated">最終更新: ${now.toLocaleString('ja-JP')}</div>
  </div>

  <div class="summary-stats">
    <div class="stat-box">
      <div class="stat-number">${chartData.length}</div>
      <div class="stat-label">登録ユーザー数</div>
    </div>
    <div class="stat-box">
      <div class="stat-number">${totalPointsAll}</div>
      <div class="stat-label">総ポイント</div>
      <div class="stat-sublabel">${totalAll}回</div>
    </div>
    <div class="stat-box">
      <div class="stat-number today">${todayPointsAll}</div>
      <div class="stat-label">本日</div>
      <div class="stat-sublabel">${todayAll}回</div>
    </div>
    <div class="stat-box">
      <div class="stat-number yesterday">${yesterdayPointsAll}</div>
      <div class="stat-label">昨日</div>
      <div class="stat-sublabel">${yesterdayAll}回</div>
    </div>
    <div class="stat-box">
      <div class="stat-number">${threeDaysPointsAll}</div>
      <div class="stat-label">3日間</div>
      <div class="stat-sublabel">${threeDaysAll}回</div>
    </div>
    <div class="stat-box">
      <div class="stat-number">${weekPointsAll}</div>
      <div class="stat-label">今週</div>
      <div class="stat-sublabel">${weekAll}回</div>
    </div>
  </div>

  <div class="user-grid">
    ${chartData.map(function(tag, i) {
      const chartId = 'chart_' + i;
      const detailUrl = '?action=dashboard&user=' + encodeURIComponent(tag.name);
      return `
    <div class="user-tile" onclick="location.href='${detailUrl}'">
      <div class="user-tile-header">
        <div class="user-name">
          ${tag.name}
          <span class="detail-arrow">👉</span>
        </div>
      </div>
      
      <div class="mini-stats">
        <div class="mini-stat">
          <div class="mini-stat-number">${tag.totalPoints}</div>
          <div class="mini-stat-label">総ポイント</div>
          <div class="mini-stat-sublabel">${tag.total}回</div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat-number today">${tag.todayPoints}</div>
          <div class="mini-stat-label">本日</div>
          <div class="mini-stat-sublabel">${tag.today}回</div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat-number yesterday">${tag.yesterdayPoints}</div>
          <div class="mini-stat-label">昨日</div>
          <div class="mini-stat-sublabel">${tag.yesterday}回</div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat-number">${tag.weekPoints}</div>
          <div class="mini-stat-label">今週</div>
          <div class="mini-stat-sublabel">${tag.week}回</div>
        </div>
      </div>
      
      <div class="chart-area" data-chart-index="${i}">
        <div class="loading">チャートを読み込み中...</div>
        <canvas id="${chartId}" style="display:none"></canvas>
      </div>
    </div>`;
    }).join('')}
  </div>
</div>

<script>
const todayDate = "${todayStr}";
const chartDataArray = ${JSON.stringify(chartData)};
const charts = new Map();

function refreshPage() {
  const currentUrl = window.location.href.split('?')[0];
  window.location.href = currentUrl + '?action=dashboard&t=' + new Date().getTime();
}

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
    label === todayDate ? 'rgba(255,107,107,0.3)' : 'rgba(102,126,234,0.1)'
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
        borderColor: 'rgb(102,126,234)',
        backgroundColor: bgColors,
        tension: 0.3,
        fill: true,
        pointRadius: function(context) {
          return context.parsed.x === labels.indexOf(todayDate) ? 6 : 2;
        },
        pointBackgroundColor: function(context) {
          return context.parsed.x === labels.indexOf(todayDate) ? '#ff6b6b' : 'rgb(102,126,234)';
        }
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2,
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
            maxRotation: 45,
            minRotation: 45,
            font: { size: 9 },
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
          ticks: { 
            stepSize: 1,
            font: { size: 10 }
          }
        }
      }
    }
  });
  
  charts.set(index, chart);
}

const observerOptions = {
  root: null,
  rootMargin: '50px',
  threshold: 0.1
};

const observer = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      const index = parseInt(entry.target.dataset.chartIndex);
      createChart(index);
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.chart-area').forEach(function(wrapper) {
    observer.observe(wrapper);
  });
});
</script>
</body>
</html>`;
  
  return HtmlService.createHtmlOutput(html);
}

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
    
    const hourlyData = {};
    const weekdayData = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0};
    const dailyData = {};
    const records = [];
    let totalPoints = 0;
    
    for (let i = 1; i < data.length; i++) {
      const recordDate = new Date(data[i][0]);
      const hour = recordDate.getHours();
      const weekday = recordDate.getDay();
      const dateStr = recordDate.toLocaleDateString('ja-JP');
      const points = parseInt(data[i][3]) || 1;
      
      hourlyData[hour] = (hourlyData[hour] || 0) + points;
      weekdayData[weekday] += points;
      dailyData[dateStr] = (dailyData[dateStr] || 0) + points;
      totalPoints += points;
      
      records.push({
        timestamp: Utilities.formatDate(recordDate, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'),
        nfcId: data[i][1],
        tagName: data[i][2],
        points: points
      });
    }
    
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
    
    const recordsHtml = records.slice(-20).reverse().map(function(rec) {
      return '<tr><td>' + rec.timestamp + '</td><td>' + rec.tagName + '</td><td class="points-cell">' + rec.points + ' pt</td></tr>';
    }).join('');
    
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