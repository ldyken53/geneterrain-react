const nodeCounts = [1e2, 5e2, 1e3, 2e3, 5e3, 1e4, 2e4, 5e4, 1e5, 2e5, 1e6];
const density = 20;
const edgeCounts = nodeCounts.map((n) => n * density);
const testCase = {
  nodeCounts,
  edgeCounts,
};
let stepCount = 0;

function generatePair(min, max) {
  function randRange(min, max) {
    return min + Math.floor(Math.random() * (max - min));
  }
  const source = randRange(min, max);
  let target = randRange(min, max);
  while (source === target) {
    target = randRange(min, max);
  }

  return {
    source: source,
    target: target,
  };
}

function generateRandomGraph(nodeCount, edgeCount) {
  const data = {
    nodes: [],
    edges: [],
  };

  data.nodes = Array(4 * nodeCount).fill();

  for (let i = 0; i < 4 * nodeCount; i = i + 4) {
    data.nodes[i] = 0;
    data.nodes[i + 1] = Math.random();
    data.nodes[i + 2] = Math.random();
    data.nodes[i + 3] = 1;
  }

  console.log("nodes created");
  const edgeHashMap = new Map();

  data.edges = Array(2 * edgeCount).fill();
  let pair;

  for (let i = 0; i < 2 * edgeCount; i = i + 2) {
    do {
      pair = generatePair(0, nodeCount);
    } while (edgeHashMap.has(`${pair.source}_${pair.target}`));
    edgeHashMap.set(`${pair.source}_${pair.target}`, true);
    edgeHashMap.set(`${pair.target}_${pair.source}`, true);
    data.edges[i] = pair.source;
    data.edges[i + 1] = pair.target;
  }
  return data;
}

function generateRandomData(nodeCounts, edgeCounts, stepCount) {
  let nodeCount = nodeCounts[stepCount];
  let edgeCount = edgeCounts[stepCount];

  let generatedData = generateRandomGraph(nodeCount, edgeCount);
  return generatedData;
}

let data = generateRandomData(nodeCounts, edgeCounts, 0);
console.log(data);

await testFunc(data);

async function testFunc(data) {}
