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
    "과정별",
    "국가별",
    "학과별",
    "학년별",
    "남여별",
    "인증지표",
    "보험상황",
    "토픽상황",
    "중도탈락",
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
