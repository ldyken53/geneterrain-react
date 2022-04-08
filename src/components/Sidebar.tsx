import React from 'react';
import {Form, Button} from "react-bootstrap";
import Collapsible from 'react-collapsible';
import { Matrix, matrix, subtract, eigs, column, min, max, index, sparse } from 'mathjs';
import Stats from "../libs/stats.module";
import * as Constant from "../constant";
import { CSVLink } from "react-csv";
import XMLWriter from "xml-writer";
import * as d3 from "d3";

const headers = [
  { label: "Node", key: "Node" },
  { label: "Edge", key: "Edge" },
  { label: "FPS", key: "FPS" },
];

const headerForLayout = [
  { label: "iterationCount", key: "iterationCount" },
  { label: "time", key: "time" },
  { label: "renderTime", key: "renderTime" },
];

type SidebarProps = {
  setNodeEdgeData: (nodeData: Array<number>, edgeData: Array<number>) => Promise<void>;
  setWidthFactor: (widthFactor: number) => void;
  setPeakValue: (value: number) => void;
  setValleyValue: (value: number) => void;
  setCoolingFactor: (value: number) => void;
  setIdealLength: (value: number) => void;
  setColorValley: (value: number) => void;
  setColorHill: (value: number) => void;
  setColorMountain: (value: number) => void;
  setGlobalRange: () => void;
  toggleNodeLayer: () => void;
  toggleTerrainLayer: () => void;
  toggleEdgeLayer: () => void;
  runForceDirected: () => void;
  onSave: () => void;
};
type SidebarState = {
  nodeData: Array<number>;
  edgeData: Array<number>;
  laplacian: Matrix;
  adjacencyMatrix: Array<Array<number>>;
  e: {};
  nodeCount: string;
  edgeCount: string;
  runBenchmark: boolean;
  jsonFormat: boolean;
  FPSData: Array<Array<string>>;
  d3timing: Array<timing>;

  // canvasAdded: boolean;
};
type edge = {
  id: string;
  source: number;
  target: number;
};
type node = {
  name: string;
  x: number;
  y: number;
};

type nodeD3 = {
  id: string;
  x: number;
  y: number;
};

type Graph = {
  nodes: Array<node>;
  edges: Array<edge>;
};

interface timing {
  iterationCount: number;
  totalTime: number;
  renderingTime: number;
}

class Sidebar extends React.Component<SidebarProps, SidebarState> {
  constructor(props) {
    super(props);
    this.state = {
      nodeData: [],
      edgeData: [],
      nodeCount: "",
      edgeCount: "",
      laplacian: sparse([]),
      adjacencyMatrix: [],
      e: {},
      jsonFormat: true,
      runBenchmark: false,
      FPSData: [],
      d3timing: [],
      // canvasAdded: false,
    };

    this.handleSubmit = this.handleSubmit.bind(this);
    this.readFiles = this.readFiles.bind(this);
    this.generateRandomGraph = this.generateRandomGraph.bind(this);
    this.generatePair = this.generatePair.bind(this);
    this.generateRandomData = this.generateRandomData.bind(this);
    this.refresh = this.refresh.bind(this);
    this.runTest = this.runTest.bind(this);
    this.runBenchmark = this.runBenchmark.bind(this);
    this.testFunc = this.testFunc.bind(this);
    this.sleep = this.sleep.bind(this);
    this.storeFPSResult = this.storeFPSResult.bind(this);

    // =========================================================
    this.d3TimingStudy = this.d3TimingStudy.bind(this);
    // this.randomDataGen_Computation = this.randomDataGen_Computation.bind(this);
  }

  handleSubmit(event) {
    event.preventDefault();
    this.props.setNodeEdgeData(this.state.nodeData, this.state.edgeData);
  }

  sleep(time) {
    return new Promise((resolve) => {
      setTimeout(resolve, time);
    });
  }

  // randomDataGen_Computation(nodeCount, edgeCount, width, height) {
  //   var nodesWebGPU: Array<number> = [];
  //   var edgesWebGPU: Array<number> = [];

  //   var nodesD3: Array<nodeD3> = [];
  //   var edgesD3: Array<edge> = [];

  //   const dataWebGPU = {
  //     nodes: nodesWebGPU,
  //     edges: edgesWebGPU,
  //   };

  //   const dataD3 = {
  //     nodes: nodesD3,
  //     edges: edgesD3,
  //   };

  //   dataWebGPU.nodes = new Array(4 * nodeCount).fill(0);
  //   dataWebGPU.edges = new Array(2 * edgeCount).fill(0);

  //   for (let i = 0; i < nodeCount; i++) {
  //     let x = Math.random();
  //     let y = Math.random();
  //     dataD3.nodes[i] = { id: i.toString(), x: x * width, y: y * height };
  //     dataWebGPU.nodes[4 * i] = 0;
  //     dataWebGPU.nodes[4 * i + 1] = x;
  //     dataWebGPU.nodes[4 * i + 2] = y;
  //     dataWebGPU.nodes[4 * i + 3] = 1;
  //   }

  //   const linkSet = new Set();

  //   for (let i = 0; i < edgeCount; i++) {
  //     let pair;
  //     do {
  //       pair = this.generatePair(0, nodeCount);
  //     } while (linkSet.has(`${pair.source}_${pair.target}`));
  //     linkSet.add(`${pair.source}_${pair.target}`);
  //     linkSet.add(`${pair.target}_${pair.source}`);

  //     dataD3.edges[i] = {
  //       id: i.toString(),
  //       source: pair.source,
  //       target: pair.target,
  //     };
  //     dataWebGPU.edges[2 * i] = pair.source;
  //     dataWebGPU.edges[2 * i + 1] = pair.target;
  //   }
  //   let dataCombined = {
  //     dataD3,
  //     dataWebGPU,
  //   };
  //   return dataCombined;
  // }

  async d3TimingStudy(event: React.MouseEvent) {
    event.preventDefault();
    const self = this;
    const width = 800;
    const height = 800;
    let iterationCount = 0;
    const iterationMeasure = {};
    let startTime;
    let lastTime;
    let totalTime;

    // var layoutCanvas = d3
    //   .select("#graphDiv")
    //   .append("canvas")
    //   .attr("width", width + "px")
    //   .attr("height", height + "px")
    //   .node();

    // let layoutDiv = document.getElementById("#graphDiv");
    // if (layoutDiv) {
    //   layoutDiv.style.color = "white";
    // }

    // let context = layoutCanvas!.getContext("2d")!;
    // if (!context) {
    //   console.log("no 2d context found");
    //   return;
    // }

    // context.fillStyle = "white";

    d3.json("./sample_test_data/test_small_spec.json").then((data: any) => {
      console.log(data);
      let timeToFormatData = 0;
      startTime = performance.now();
      lastTime = startTime;
      const simulation = d3
        .forceSimulation(data.nodes)
        .force("charge", d3.forceManyBody().strength(-40))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("link", d3.forceLink(data.edges).distance(400).strength(2.0))
        .alphaDecay(0.077);

      initGraph(data);

      function initGraph(data) {
        simulation.on("tick", simulationUpdate);
        simulation.on("end", async () => {
          let extraTime = performance.now();
          await self.props.setNodeEdgeData(
            self.state.nodeData,
            self.state.edgeData
          );
          let extraEnd = performance.now();
          let currentTime2 = performance.now();
          totalTime = currentTime2 - startTime;
          const [totalAverageTime, layoutAverageTime, renderAverageTime] =
            findAverage(self.state.d3timing);
          console.log(
            "totalAverageTime",
            totalAverageTime,
            "layoutAverageTime",
            layoutAverageTime,
            "averageTimetoRender",
            renderAverageTime
          );
          console.log("totalTime", totalTime - timeToFormatData);
        });
      }

      function formatData(nodesList, edgesList) {
        var nodes: Array<number> = [];
        var edges: Array<number> = [];
        const data = {
          nodes: nodes,
          edges: edges,
        };

        let nodeCount = nodesList.length;
        data.nodes = Array(4 * nodeCount).fill(0);

        let maxX = 0;
        let maxY = 0;

        for (let i = 0; i < 4 * nodeCount; i = i + 4) {
          data.nodes[i] = 0;
          let nodeX = Math.abs(nodesList[i / 4].x);
          let nodeY = Math.abs(nodesList[i / 4].y);
          if (nodeX > maxX) {
            maxX = nodeX;
          }
          if (nodeY > maxY) {
            maxY = nodeY;
          }
          data.nodes[i + 3] = 1;
        }

        for (let i = 0; i < 4 * nodeCount; i = i + 4) {
          data.nodes[i + 1] = nodesList[i / 4].x / maxX;
          data.nodes[i + 2] = nodesList[i / 4].y / maxY;
        }

        data.edges = Array(2 * nodeCount * 20).fill(0);
        for (let i = 0; i < 2 * 20 * nodeCount; i = i + 2) {
          data.edges[i] = parseInt(edgesList[i / 2].source.name);
          data.edges[i + 1] = parseInt(edgesList[i / 2].target.name);
        }
        return data;
      }

      function findAverage(d3timing) {
        let totalAverageTime =
          d3timing.reduce((a, b) => {
            return a + b.totalTime;
          }, 0) / d3timing.length;
        let renderAvergaeTime =
          d3timing.reduce((a, b) => a + b.renderingTime, 0) / d3timing.length;
        let layoutAverageTime =
          d3timing.reduce((a, b) => a + (b.totalTime - b.renderingTime), 0) /
          d3timing.length;

        return [totalAverageTime, layoutAverageTime, renderAvergaeTime];
      }

      async function simulationUpdate() {
        let currentTime = performance.now();

        let formatStartTime = performance.now();
        let newData = formatData(data.nodes, data.edges);
        let formatStopTime = performance.now();
        let localtimeToFormatData = formatStopTime - formatStartTime;
        timeToFormatData += localtimeToFormatData;

        self.setState({ nodeData: newData.nodes });
        await self.props.setNodeEdgeData(newData.nodes, newData.edges);

        let renderTime = 0;

        let endTime = performance.now();
        // lastTime = currentTime;
        let dt = endTime - currentTime - localtimeToFormatData;
        iterationCount++;
        console.log(iterationCount, dt);
        iterationMeasure[iterationCount] = dt;
        self.setState({
          d3timing: [
            ...self.state.d3timing,
            {
              iterationCount: iterationCount,
              totalTime: dt,
              renderingTime: renderTime,
            },
          ],
        });
      }
    });
  }

  async runBenchmark(event: React.MouseEvent) {
    try {
      event.preventDefault();
      // 5e2, 1e3, 2e3, 5e3, 1e4, 2e4, 3e4, 4e4, 1e5
      const nodeCounts = [1e2, 1e3, 2e3, 5e3, 1e4];
      const density = 20;
      const edgeCounts = nodeCounts.map((n) => n * density);
      this.setState({ runBenchmark: true });
      let renderingCanvas = document.querySelectorAll("canvas")[0];
      renderingCanvas.width = 500;
      renderingCanvas.height = 500;
      renderingCanvas.style.width = "500px";
      renderingCanvas.style.height = "500px";
      // const testCase = {
      //   nodeCounts,
      //   edgeCounts,
      // };

      for (let i = 0; i < nodeCounts.length; i++) {
        let stats = Stats();
        stats.showPanel(0);
        stats.dom.setAttribute("class", "status");
        document.body.appendChild(stats.dom);
        // let stepCount = 0;
        const nCount = nodeCounts[i].toString();
        const eCount = edgeCounts[i].toString();

        this.setState({ nodeCount: nCount });
        this.setState({ edgeCount: eCount });

        let data = this.generateRandomData(nodeCounts, edgeCounts, i);
        this.setState({ nodeData: data.nodes });
        this.setState({ edgeData: data.edges });
        // this.props.setNodeEdgeData(this.state.nodeData, this.state.edgeData);
        await this.testFunc(data, stats);
      }

      this.setState({ runBenchmark: false });
      renderingCanvas.width = 800;
      renderingCanvas.height = 800;
      renderingCanvas.style.width = "800px";
      renderingCanvas.style.height = "800px";
    } catch (e) {
      console.log(e);
    }
  }

  generatePair(min, max) {
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

  generateRandomData(nodeCounts, edgeCounts, stepCount) {
    let nodeCount = nodeCounts[stepCount];
    let edgeCount = edgeCounts[stepCount];

    let generatedData = this.generateRandomGraph(nodeCount, edgeCount);
    return generatedData;
  }

  
  generateRandomGraph(nodeCount, edgeCount) {
    var nodes: Array<number> = [];
    var edges: Array<number> = [];
    const data = {
      nodes: nodes,
      edges: edges,
    };

    data.nodes = Array(4 * nodeCount).fill(0);

    for (let i = 0; i < 4 * nodeCount; i = i + 4) {
      data.nodes[i] = 0;
      data.nodes[i + 1] = Math.random();
      data.nodes[i + 2] = Math.random();
      data.nodes[i + 3] = 1;
    }
    data.edges = Array(2 * edgeCount).fill(0);
    let pair;

    for (let i = 0; i < 2 * edgeCount; i = i + 2) {
      pair = this.generatePair(0, nodeCount);
      data.edges[i] = pair.source;
      data.edges[i + 1] = pair.target;
    }
    console.log("data generated");
    return data;
  }

  refresh(length) {
    try {
      var nodes: Array<number> = [];
      for (let i = 0; i < 4 * length; i = i + 4) {
        nodes[i + 1] = Math.random();
        nodes[i + 2] = Math.random();
      }
      this.setState({ nodeData: nodes });
      this.props.setNodeEdgeData(nodes, this.state.edgeData);
      // console.log("rendererd");
    } catch (err) {
      console.error(err);
    }
  }

  storeFPSResult(nodeLength, edgeLength, fps) {
    nodeLength = nodeLength.toString();
    edgeLength = edgeLength.toString();
    fps = fps.toString();

    this.setState({
      FPSData: [...this.state.FPSData, [nodeLength, edgeLength, fps]],
    });
  }

  async testFunc(data, stats) {
    let nodeLength = data.nodes.length / 4;
    let edgeLength = data.edges.length / 2;
    console.log(nodeLength);
    await this.runTest(nodeLength, edgeLength, stats);
  }

  async runTest(nodeLength, edgeLength, stats) {
    try {
      let requestId;
      let count = 0;
      const refreshing = () => {
        stats.begin();
        // console.log("intiital count", count);
        // count++;
        this.refresh(nodeLength);
        // console.log("final count", count);
        stats.end();
        requestId = requestAnimationFrame(refreshing);
      };
      refreshing();
      await this.sleep(Constant.TIME_FOR_EACH_TEST);
      let FPS_Array = stats.getFPSHistory();
      console.log(FPS_Array);
      let FPS = FPS_Array.reduce((a, b) => a + b, 0) / FPS_Array.length;
      this.storeFPSResult(nodeLength, edgeLength, FPS);
      cancelAnimationFrame(requestId);
      return;
    } catch (err) {
      console.error(err);
    }
  }
  readFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files: FileList = event.target.files!;
    console.log(files);
    var nodeIDToValue = {};
    // var nodeIDToPos = {};
    var nodeIDToIndex = {};
    var nodeData: Array<number> = [];
    var edgeData: Array<number> = [];
    var degreeMatrix: Array<Array<number>> = [];
    var adjacencyMatrix: Array<Array<number>> = [];
    const edgeReader = new FileReader();
    edgeReader.onload = (event) => {
      var edgeRaw = (edgeReader.result as string).split("\n");
      for (var element of edgeRaw) {
        var parts = element.split("\t");
        if (nodeIDToValue[parts[0]] && nodeIDToValue[parts[1]]) {
          edgeData.push(nodeIDToIndex[parts[0]], nodeIDToIndex[parts[1]]);
          degreeMatrix[nodeIDToIndex[parts[0]]][nodeIDToIndex[parts[0]]] += 1;
          degreeMatrix[nodeIDToIndex[parts[1]]][nodeIDToIndex[parts[1]]] += 1;
          adjacencyMatrix[nodeIDToIndex[parts[0]]][
            nodeIDToIndex[parts[1]]
          ] += 1;
          adjacencyMatrix[nodeIDToIndex[parts[1]]][
            nodeIDToIndex[parts[0]]
          ] += 1;
        }
      }
      this.setState({ edgeData: edgeData });
      var laplacian: Matrix = subtract(
        sparse(degreeMatrix),
        sparse(adjacencyMatrix)
      ) as Matrix;
      console.log(laplacian);
      this.setState({ laplacian: laplacian, adjacencyMatrix: adjacencyMatrix });
    };
    const layoutReader = new FileReader();
    layoutReader.onload = (event) => {
      var layoutData = (layoutReader.result as string).split("\n");
      for (var element of layoutData) {
        var parts = element.split("\t");
        if (nodeIDToValue[parts[0]]) {
          nodeIDToIndex[parts[0]] = nodeData.length / 4;
          // Pushes values to node data in order of struct for WebGPU:
          // nodeValue, nodeX, nodeY, nodeSize
          nodeData.push(
            parseFloat(nodeIDToValue[parts[0]]),
            parseFloat(parts[1]),
            parseFloat(parts[2]),
            parseFloat(parts[3])
          );
          // nodeIDToPos[parts[0]] = [parseFloat(parts[1]) * 2.0 - 1, parseFloat(parts[2]) * 2.0 - 1];
        }
      }
      this.setState({ nodeData: nodeData });
      for (var i = 0; i < nodeData.length / 4; i++) {
        degreeMatrix.push([]);
        adjacencyMatrix.push([]);
        for (var j = 0; j < nodeData.length / 4; j++) {
          degreeMatrix[i].push(0);
          adjacencyMatrix[i].push(0);
        }
      }
      edgeReader.readAsText(files[2]);
    };
    const nodeReader = new FileReader();
    nodeReader.onload = (event) => {
      var rawNodes = (nodeReader.result as string).split("\n");
      for (var element of rawNodes) {
        nodeIDToValue[element.split("\t")[0]] = element.split("\t")[1];
      }
      console.log(nodeIDToValue);
      layoutReader.readAsText(files[1]);
    };
    nodeReader.readAsText(files[0]);
  }

  readJson(event: React.ChangeEvent<HTMLInputElement>) {
    const files: FileList = event.target.files!;
    const jsonReader = new FileReader();
    var nodeData: Array<number> = [];
    var edgeData: Array<number> = [];
    jsonReader.onload = (event) => {
      var graph: Graph = JSON.parse(jsonReader.result as string);
      console.log(graph);
      for (var i = 0; i < graph.nodes.length; i++) {
        if (graph.nodes[i].x) {
          nodeData.push(0.0, graph.nodes[i].x, graph.nodes[i].y, 1.0);
        } else {
          nodeData.push(0.0, Math.random(), Math.random(), 1.0);
        }
      }
      for (var i = 0; i < graph.edges.length; i++) {
        var source = graph.edges[i].source;
        var target = graph.edges[i].target;
        edgeData.push(source, target);
      }
      this.setState({ nodeData: nodeData, edgeData: edgeData });
    };
    jsonReader.readAsText(files[0]);
  }

  applySpectral() {
    var e = eigs(this.state.laplacian);
    console.log(e);
    var nodeData = this.state.nodeData;
    var x = column(e.vectors, 1) as Matrix;
    var y = column(e.vectors, 2) as Matrix;
    var x_max = max(x);
    var y_max = max(y);
    var x_min = min(x);
    var y_min = min(y);
    for (var i = 0; i < nodeData.length / 4; i++) {
      nodeData[i * 4 + 1] = (x.get([i, 0]) - x_min) / (x_max - x_min);
      nodeData[i * 4 + 2] = (y.get([i, 0]) - y_min) / (y_max - y_min);
    }
    this.setState({ nodeData: nodeData });
    this.props.setNodeEdgeData(nodeData, this.state.edgeData);
  }

  onSaveXML() {
    var xw = new XMLWriter(true);
    xw.startDocument();
    xw.startElement("GeneTerrain");
    xw.startElement("Nodes");
    for (var i = 0; i < this.state.nodeData.length; i += 4) {
      xw.startElement("Node");
      xw.writeAttribute("NodeID", i / 4);
      xw.writeAttribute("InputValue", this.state.nodeData[i]);
      xw.writeAttribute("InputWeight", this.state.nodeData[i + 3]);
      xw.writeAttribute("NodeBackendX", this.state.nodeData[i + 1]);
      xw.writeAttribute("NodeBackendY", this.state.nodeData[i + 2]);
      xw.endElement("Node");
    }
    xw.endElement("Nodes");
    xw.startElement("Edges");
    for (var i = 0; i < this.state.edgeData.length; i += 2) {
      xw.startElement("Edge");
      xw.writeAttribute("BeginID", this.state.edgeData[i]);
      xw.writeAttribute("EndID", this.state.edgeData[i + 1]);
      xw.endElement("Edge");
    }
    xw.endElement("Edges");
    xw.endDocument();
    const element = document.createElement("a");
    const file = new Blob([xw.toString()], { type: "application/xml" });
    element.href = URL.createObjectURL(file);
    element.download = "terrain.xml";
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  }

  render() {
    return (
      <div className="sidebar">
        <hr />
        <Button className="benchmark_test" onClick={this.runBenchmark}>
          Run Benchmark
        </Button>
        <div style={{ margin: 10, color: "white" }}>
          <p>Node count: {this.state.nodeCount}</p>
          <p>Edge count: {this.state.edgeCount}</p>
        </div>
        <CSVLink data={this.state.FPSData}>Download FPS data</CSVLink>
        <hr />

        <Button className="d3Timing_test" onClick={this.d3TimingStudy}>
          Run D3
        </Button>
        <CSVLink data={this.state.d3timing} header={headerForLayout}>
          Download FPS data
        </CSVLink>

        <Form style={{ color: "white" }} onSubmit={this.handleSubmit}>
          <Form.Group controlId="formFile" className="mt-3 mb-3">
            <Form.Check
              defaultChecked={true}
              onClick={() =>
                this.setState({ jsonFormat: !this.state.jsonFormat })
              }
              type="checkbox"
              label="Json Format"
            ></Form.Check>
            <Form.Label>Select Example Files</Form.Label>
            <Form.Control
              className="form-control"
              type="file"
              multiple
              onChange={(e) => {
                if (this.state.jsonFormat) {
                  this.readJson(e as React.ChangeEvent<HTMLInputElement>);
                } else {
                  this.readFiles(e as React.ChangeEvent<HTMLInputElement>);
                }
              }}
            />
            <Button
              className="mt-2"
              type="submit"
              variant="secondary"
              value="Submit"
            >
              Submit
            </Button>
          </Form.Group>
          <Collapsible trigger="Terrain Options">
            <Form.Group>
              <Form.Label> Width Factor </Form.Label>
              <br />
              <input
                type="range"
                defaultValue={1000}
                min={0}
                max={2000}
                onChange={(e) =>
                  this.props.setWidthFactor(parseFloat(e.target.value))
                }
              />
            </Form.Group>
            <Form.Group>
              <Form.Label> Peak and Valley Values </Form.Label>
              <br />
              <input
                type="range"
                defaultValue={0.8}
                min={0.5}
                max={1}
                step={0.01}
                onChange={(e) =>
                  this.props.setPeakValue(parseFloat(e.target.value))
                }
              />
              <input
                type="range"
                defaultValue={0.2}
                min={0}
                max={0.5}
                step={0.01}
                onChange={(e) =>
                  this.props.setValleyValue(parseFloat(e.target.value))
                }
              />
            </Form.Group>
            <Form.Group>
              <Form.Check
                defaultChecked={true}
                onClick={(e) => this.props.setGlobalRange()}
                type="checkbox"
                label="Use Global Min/Max"
              ></Form.Check>
            </Form.Group>
          </Collapsible>
          <Collapsible trigger="Colormap Options">
            <Form.Row>
              <div>Valley</div>
              <input
                type="range"
                defaultValue={45}
                min={1}
                max={60}
                step={1}
                onChange={(e) =>
                  this.props.setColorValley(parseFloat(e.target.value))
                }
              />
            </Form.Row>
            <Form.Row>
              <div>Hill</div>
              <input
                type="range"
                defaultValue={90}
                min={61}
                max={120}
                step={1}
                onChange={(e) =>
                  this.props.setColorHill(parseFloat(e.target.value))
                }
              />
            </Form.Row>
            <Form.Row>
              <div>Mountain</div>
              <input
                type="range"
                defaultValue={135}
                min={121}
                max={180}
                step={1}
                onChange={(e) =>
                  this.props.setColorMountain(parseFloat(e.target.value))
                }
              />
            </Form.Row>
          </Collapsible>
          <Collapsible trigger="Layers">
            <Form.Check
              defaultChecked={false}
              onClick={(e) => this.props.toggleTerrainLayer()}
              type="checkbox"
              label="Terrain Layer"
            />
            <Form.Check
              defaultChecked={true}
              onClick={(e) => this.props.toggleNodeLayer()}
              type="checkbox"
              label="Node Layer"
            />
            <Form.Check
              defaultChecked={true}
              onClick={(e) => this.props.toggleEdgeLayer()}
              type="checkbox"
              label="Edge Layer"
            />
          </Collapsible>
          <Collapsible trigger="Force Directed Options">
            <Form.Label> Ideal Length and Cooling Factor </Form.Label>
            <br />
            <input
              type="range"
              defaultValue={0.05}
              min={0.001}
              max={0.1}
              step={0.001}
              onChange={(e) =>
                this.props.setIdealLength(parseFloat(e.target.value))
              }
            />
            <input
              type="range"
              defaultValue={0.9}
              min={0.75}
              max={0.999}
              step={0.001}
              onChange={(e) =>
                this.props.setCoolingFactor(parseFloat(e.target.value))
              }
            />
          </Collapsible>
          <Button onClick={(e) => this.props.onSave()}>Save Terrain</Button>
          <br />
          <Button onClick={(e) => this.applySpectral()}>
            Apply Spectral Layout
          </Button>
          <br />
          <Button onClick={(e) => this.props.runForceDirected()}>
            Run Force Directed Layout
          </Button>
          <br />
          <Button onClick={(e) => this.onSaveXML()}>Save Terrain to XML</Button>
        </Form>
      </div>
    );
  }
}

export default Sidebar;