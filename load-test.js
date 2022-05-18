import http from "k6/http";
const DELAY = 15;

const thresholds = {};
thresholds[`http_req_duration{scenario:worker${DELAY}ms}`] = ["med<250"];
thresholds[`http_req_duration{scenario:single${DELAY}ms}`] = ["med<250"];
thresholds[`http_reqs{scenario:worker${DELAY}ms}`] = ["count>10"];
thresholds[`http_reqs{scenario:single${DELAY}ms}`] = ["count>10"];
thresholds[`data_received{scenario:worker${DELAY}ms}`] = ["count>50"];
thresholds[`data_received{scenario:single${DELAY}ms}`] = ["count>50"];

const scenarios = {};
scenarios[`worker${DELAY}ms`] = {
  executor: "constant-vus",
  vus: 300,
  duration: "30s",
  exec: "worker",
};

scenarios[`single${DELAY}ms`] = {
  executor: "constant-vus",
  vus: 300,
  duration: "30s",
  startTime: "45s",
  exec: "single",
};

export const options = {
  thresholds,
  scenarios,
};

export function worker() {
  http.get(`http://localhost:3000/aw?delay=${DELAY}`, {
    tags: { my_custom_tag: `worker${DELAY}ms` },
  });
}

export function single() {
  http.get(`http://localhost:3000/as?delay=${DELAY}`, {
    tags: { my_custom_tag: `single${DELAY}ms` },
  });
}
