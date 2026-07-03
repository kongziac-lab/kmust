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
    "남녀별",
    "인증지표",
    "중도탈락율",
    "토픽취득율",
    "보험가입율",
    "상담비율",
  ];

  for (const label of expectedLabels) {
    assert.match(html, new RegExp(label), `${label} label should be rendered`);
  }
});

test("monitor dashboard defaults to the overview mode", async () => {
  const response = await getHtml(baseUrl);
  assert.equal(response.status, 200);

  const html = response.body;
  assert.match(html, /aria-pressed="true"[^>]*>총괄보기/);
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
    "출결 관찰 대상",
    "3과목 이상",
    "5과목 이상",
    "7과목 이상",
  ];

  for (const text of expectedContent) {
    assert.match(html, new RegExp(text), `${text} should be rendered`);
  }
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
    "결석 과목",
    "최근 1주일",
  ];

  for (const text of expectedContent) {
    assert.match(html, new RegExp(text), `${text} should be rendered`);
  }
});
