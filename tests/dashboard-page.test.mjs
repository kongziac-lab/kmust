import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";

const baseUrl = process.env.DASHBOARD_URL || "http://127.0.0.1:3000";

function getHtml(url) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, (response) => {
      let body = "";

      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.on("end", () => {
        resolve({ status: response.statusCode, body });
      });
    });

    request.on("error", reject);
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("monitor dashboard exposes the requested mode buttons", async () => {
  const response = await getHtml(baseUrl);
  assert.equal(response.status, 200);

  const html = response.body;
  const expectedLabels = [
    "총괄보기",
    "출결상황",
    "현황보기",
    "과정별",
    "국가별",
    "학과별",
    "학년별",
    "조합분석",
    "인증지표",
    "중도탈락율",
    "토픽취득율",
    "보험가입율",
    "상담비율",
  ];

  for (const label of expectedLabels) {
    assert.match(html, new RegExp(label), `${label} label should be rendered`);
  }

  assert.doesNotMatch(html, /남녀별/, "남녀별 mode should be removed");
});

test("monitor dashboard defaults to the overview mode", async () => {
  const response = await getHtml(baseUrl);
  assert.equal(response.status, 200);

  const html = response.body;
  assert.match(html, /aria-pressed="true"[^>]*>총괄보기/);
});

test("monitor mode controls are client-side buttons", async () => {
  const response = await getHtml(baseUrl);
  assert.equal(response.status, 200);

  const html = response.body;
  assert.match(html, /client-mode-switcher/, "mode switcher should render as a client control area");
  assert.match(html, /type="button"[^>]*value="attendance"/, "attendance mode should use a client button");
  assert.match(html, /type="button"[^>]*value="certification"/, "certification mode should use a client button");
  assert.doesNotMatch(html, /type="submit"[^>]*name="mode"/, "mode buttons should not submit full page requests");
});

test("monitor dashboard polls the summary API without reloading the page", async () => {
  const response = await getHtml(baseUrl);
  assert.equal(response.status, 200);

  const html = response.body;
  assert.match(html, /data-live-summary-polling="10000"/, "summary polling interval should be 10 seconds");
  assert.match(html, /data-live-summary-endpoint="\/api\/dashboard\/summary"/, "summary API endpoint should be configured");
  assert.doesNotMatch(html, /location\.reload/, "dashboard should not use a full page reload for live updates");
});

test("certification mode renders document-based indicator management", async () => {
  const response = await getHtml(`${baseUrl}/?mode=certification`);
  assert.equal(response.status, 200);

  const html = response.body;
  const expectedContent = [
    "교육국제화역량 인증제 추진계획",
    "중도탈락율",
    "토픽취득율",
    "보험가입율",
    "상담비율",
    "6% 미만",
    "40% 이상",
    "95% 이상",
    "3점 이상",
    "중도탈락 학생 수",
    "TOPIK",
    "의료보험 가입률",
    "상담\\(정신건강\\)",
  ];

  for (const text of expectedContent) {
    assert.match(html, new RegExp(text), `${text} should be rendered`);
  }
});

test("overview renders today and weekly attendance observation summaries", async () => {
  const response = await getHtml(baseUrl);
  assert.equal(response.status, 200);

  const html = response.body;
  const expectedContent = [
    "오늘 출결",
    "최근 1주일 출결",
    "overview-attendance-panel",
    "overview-attendance-line",
    "overview-attendance-breakdown",
    "출결 관찰 대상",
    "3과목 이상",
    "5과목 이상",
    "7과목 이상",
  ];

  for (const text of expectedContent) {
    assert.match(html, new RegExp(text), `${text} should be rendered`);
  }
});

test("overview certification summary renders details and management badges", async () => {
  const response = await getHtml(baseUrl);
  assert.equal(response.status, 200);

  const html = response.body;
  const expectedContent = [
    "인증지표 요약",
    "summary-certification-card",
    "summary-status-badge",
    "summary-value-stack",
    "summary-count-ratio",
    "summary-count-ratio-row",
    "문서 기준: 의료보험 가입률 95% 이상",
    "1,790/2,619명",
    "관리 필요",
    "정성 관리",
  ];

  for (const text of expectedContent) {
    assert.match(html, new RegExp(escapeRegExp(text)), `${text} should be rendered`);
  }

  assert.doesNotMatch(html, /1,790 \/ 2,619명/, "summary ratio counts should avoid wrapping spaces");
  assert.doesNotMatch(
    html,
    /summary-value-row[^>]*justify-between/,
    "summary value and count should not share a compressed horizontal row",
  );
  assert.doesNotMatch(
    html,
    /summary-count-ratio[^"]*truncate/,
    "summary ratio counts should remain fully visible instead of being truncated",
  );
});

test("attendance mode renders absence threshold counts and student lists", async () => {
  const response = await getHtml(`${baseUrl}/?mode=attendance`);
  assert.equal(response.status, 200);

  const html = response.body;
  const expectedContent = [
    "결석 누적 관찰",
    "3과목 이상",
    "5과목 이상",
    "7과목 이상",
    "관찰 대상 리스트",
    "absence-roll",
    "absence-roll-track",
    "absence-roll-row",
    "결석 과목",
    "최근 1주일",
  ];

  for (const text of expectedContent) {
    assert.match(html, new RegExp(text), `${text} should be rendered`);
  }
});

test("dashboard summary harness observer has no failed runs", async () => {
  const response = await getHtml(`${baseUrl}/api/dashboard/summary`);
  assert.equal(response.status, 200);

  const summary = JSON.parse(response.body);
  const runs = summary.harnessRuns;
  assert.equal(Array.isArray(runs), true, "harnessRuns should be present");
  assert.deepEqual(
    runs.map((run) => run.target).sort(),
    ["attendance", "classes", "students"],
  );
  assert.equal(runs.some((run) => run.status === "failed"), false, "harness observer should not report failures");
});

test("status mode renders one-page status overview without gender mode", async () => {
  const response = await getHtml(`${baseUrl}/?mode=status`);
  assert.equal(response.status, 200);

  const html = response.body;
  const expectedContent = [
    "재적현황",
    "data-enrollment-filter-control",
    "data-enrollment-filter=\"enrolled\"",
    "data-enrollment-filter=\"active\"",
    "data-enrollment-filter=\"leave\"",
    "재적",
    "재학",
    "휴학",
    "과정별 현황",
    "국가별 현황",
    "학과별 현황",
    "학년별 현황",
    "조합분석",
    "과정별 국가 현황",
    "status-overview-grid",
    "status-overview-panel",
    "상세내역",
  ];

  for (const text of expectedContent) {
    assert.match(html, new RegExp(escapeRegExp(text)), `${text} should be rendered`);
  }

  assert.doesNotMatch(html, /남녀별/, "gender status mode should not be rendered");
});

test("status category modes render detailed breakdowns", async () => {
  const cases = [
    ["program", "과정별 상세내역", "학사과정"],
    ["nationality", "국가별 상세내역", "베트남"],
    ["department", "학과별 상세내역", "경영학과"],
    ["grade", "학년별 상세내역", "1학년"],
    ["programNationality", "조합분석", "과정별 국가 현황"],
  ];

  for (const [mode, title, sampleItem] of cases) {
    const response = await getHtml(`${baseUrl}/?mode=${mode}`);
    assert.equal(response.status, 200);

    const html = response.body;
    const expectedContent = [
      title,
      sampleItem,
      "status-detail-grid",
      "status-detail-row",
      "data-enrollment-filter-control",
      "분포 순위",
      "상세내역",
    ];

    for (const text of expectedContent) {
      assert.match(html, new RegExp(escapeRegExp(text)), `${text} should be rendered for ${mode}`);
    }
  }
});

test("status combination mode renders free combination controls", async () => {
  const response = await getHtml(`${baseUrl}/?mode=programNationality`);
  assert.equal(response.status, 200);

  const html = response.body;
  const expectedContent = [
    "조합분석",
    "과정별 국가 현황",
    "data-combination-analysis",
    "data-combination-row-dimension=\"program\"",
    "data-combination-column-dimension=\"nationality\"",
    "기준",
    "세부",
    "필터 기준",
    "필터 값",
    "전체",
    "과정",
    "국가",
    "학과",
    "학년",
    "학사과정",
    "베트남",
  ];

  for (const text of expectedContent) {
    assert.match(html, new RegExp(escapeRegExp(text)), `${text} should be rendered for free combination mode`);
  }
});

test("dashboard summary exposes enrollment-filtered status distributions", async () => {
  const response = await getHtml(`${baseUrl}/api/dashboard/summary`);
  assert.equal(response.status, 200);

  const summary = JSON.parse(response.body);
  assert.equal(typeof summary.statusGroups.enrolled.total, "number");
  assert.equal(typeof summary.statusGroups.active.total, "number");
  assert.equal(typeof summary.statusGroups.leave.total, "number");
  assert.equal(summary.statusGroups.enrolled.total, summary.statusGroups.active.total + summary.statusGroups.leave.total);

  const combined = summary.statusGroups.enrolled.distributions.programNationality;
  assert.equal(Array.isArray(combined), true);
  assert.equal(combined.some((item) => item.name.includes(" · ") && item.value > 0), true);

  const records = summary.statusGroups.enrolled.records;
  assert.equal(Array.isArray(records), true);
  assert.equal(records.length, summary.statusGroups.enrolled.total);
  assert.deepEqual(Object.keys(records[0]).sort(), ["department", "grade", "nationality", "program"]);
  assert.equal("studentNo" in records[0], false);
});

test("attendance and certification modes use bounded monitor layouts", async () => {
  const attendanceResponse = await getHtml(`${baseUrl}/?mode=attendance`);
  assert.equal(attendanceResponse.status, 200);

  const attendanceHtml = attendanceResponse.body;
  const expectedAttendanceClasses = [
    "attendance-left-column",
    "attendance-main-panel",
    "attendance-main-grid",
    "xl:grid-rows-[minmax(0,0.7fr)_minmax(0,0.3fr)]",
  ];

  for (const className of expectedAttendanceClasses) {
    assert.match(attendanceHtml, new RegExp(escapeRegExp(className)), `${className} should be rendered`);
  }

  const certificationResponse = await getHtml(`${baseUrl}/?mode=certification`);
  assert.equal(certificationResponse.status, 200);

  const certificationHtml = certificationResponse.body;
  const expectedCertificationClasses = [
    "certification-index",
    "certification-detail-grid",
    "indicator-progress",
    "xl:grid-rows-[repeat(4,minmax(0,1fr))]",
  ];

  for (const className of expectedCertificationClasses) {
    assert.match(certificationHtml, new RegExp(escapeRegExp(className)), `${className} should be rendered`);
  }
});

test("overview uses a full-height monitor grid", async () => {
  const response = await getHtml(baseUrl);
  assert.equal(response.status, 200);

  const html = response.body;
  const expectedClasses = [
    "dashboard-stage",
    "monitor-grid",
    "monitor-panel",
    "overview-left-column",
    "overview-right-column",
    "auto-rows-fr",
    "xl:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]",
  ];

  for (const className of expectedClasses) {
    assert.match(html, new RegExp(escapeRegExp(className)), `${className} should be rendered`);
  }
});
