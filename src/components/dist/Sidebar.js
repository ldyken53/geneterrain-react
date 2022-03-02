"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
var react_1 = require("react");
var react_bootstrap_1 = require("react-bootstrap");
var react_collapsible_1 = require("react-collapsible");
var mathjs_1 = require("mathjs");
var stats_module_1 = require("../libs/stats.module");
var Constant = require("../constant");
var react_csv_1 = require("react-csv");
var xml_writer_1 = require("xml-writer");
var headers = [
    { label: "Node", key: "Node" },
    { label: "Edge", key: "Edge" },
    { label: "FPS", key: "FPS" },
];
var Sidebar = /** @class */ (function (_super) {
    __extends(Sidebar, _super);
    function Sidebar(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {
            nodeData: [],
            edgeData: [],
            nodeCount: "",
            edgeCount: "",
            laplacian: mathjs_1.sparse([]),
            adjacencyMatrix: [],
            e: {},
            jsonFormat: true,
            runBenchmark: false,
            FPSData: []
        };
        _this.handleSubmit = _this.handleSubmit.bind(_this);
        _this.readFiles = _this.readFiles.bind(_this);
        _this.generateRandomGraph = _this.generateRandomGraph.bind(_this);
        _this.generatePair = _this.generatePair.bind(_this);
        _this.generateRandomData = _this.generateRandomData.bind(_this);
        _this.refresh = _this.refresh.bind(_this);
        _this.runTest = _this.runTest.bind(_this);
        _this.runBenchmark = _this.runBenchmark.bind(_this);
        _this.testFunc = _this.testFunc.bind(_this);
        _this.sleep = _this.sleep.bind(_this);
        _this.storeFPSResult = _this.storeFPSResult.bind(_this);
        // =========================================================
        _this.d3TimingStudy = _this.d3TimingStudy.bind(_this);
        _this.randomDataGen_Computation = _this.randomDataGen_Computation.bind(_this);
        return _this;
    }
    Sidebar.prototype.handleSubmit = function (event) {
        event.preventDefault();
        this.props.setNodeEdgeData(this.state.nodeData, this.state.edgeData);
    };
    Sidebar.prototype.sleep = function (time) {
        return new Promise(function (resolve) {
            setTimeout(resolve, time);
        });
    };
    Sidebar.prototype.randomDataGen_Computation = function (nodeCount, edgeCount, width, height) {
        var nodesWebGPU = [];
        var edgesWebGPU = [];
        var nodesD3 = [];
        var edgesD3 = [];
        var dataWebGPU = {
            nodes: nodesWebGPU,
            edges: edgesWebGPU
        };
        var dataD3 = {
            nodes: nodesD3,
            edges: edgesD3
        };
        dataWebGPU.nodes = new Array(4 * nodeCount).fill(0);
        dataWebGPU.edges = new Array(2 * edgeCount).fill(0);
        for (var i = 0; i < nodeCount; i++) {
            var x = Math.random();
            var y = Math.random();
            dataD3.nodes[i] = { id: i.toString(), x: x * width, y: y * height };
            dataWebGPU.nodes[4 * i] = 0;
            dataWebGPU.nodes[4 * i + 1] = x;
            dataWebGPU.nodes[4 * i + 2] = y;
            dataWebGPU.nodes[4 * i + 3] = 1;
        }
        var linkSet = new Set();
        for (var i = 0; i < edgeCount; i++) {
            var pair = void 0;
            do {
                pair = this.generatePair(0, nodeCount);
            } while (linkSet.has(pair.source + "_" + pair.target));
            linkSet.add(pair.source + "_" + pair.target);
            linkSet.add(pair.target + "_" + pair.source);
            dataD3.edges[i] = {
                source: pair.source,
                target: pair.target
            };
            dataWebGPU.edges[2 * i] = pair.source;
            dataWebGPU.edges[2 * i + 1] = pair.target;
        }
        var dataCombined = {
            dataD3: dataD3,
            dataWebGPU: dataWebGPU
        };
        return dataCombined;
    };
    Sidebar.prototype.d3TimingStudy = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var width, height, nodeCount, density, edgeCount, renderingCanvas, data;
            return __generator(this, function (_a) {
                event.preventDefault();
                width = 800;
                height = 800;
                nodeCount = 100;
                density = 20;
                edgeCount = nodeCount * density;
                renderingCanvas = document.querySelectorAll("canvas")[0];
                data = this.randomDataGen_Computation(nodeCount, edgeCount, width, height);
                console.log(data);
                return [2 /*return*/];
            });
        });
    };
    Sidebar.prototype.runBenchmark = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var nodeCounts, density, edgeCounts, stats, renderingCanvas, i, nCount, eCount, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        event.preventDefault();
                        nodeCounts = [1e2, 5e2, 1e3, 2e3, 5e3, 1e4, 2e4, 5e4, 1e5, 2e5, 1e6];
                        density = 20;
                        edgeCounts = nodeCounts.map(function (n) { return n * density; });
                        stats = stats_module_1["default"]();
                        stats.showPanel(0);
                        stats.dom.setAttribute("class", "status");
                        document.body.appendChild(stats.dom);
                        this.setState({ runBenchmark: true });
                        renderingCanvas = document.querySelectorAll("canvas")[0];
                        renderingCanvas.width = 500;
                        renderingCanvas.height = 500;
                        renderingCanvas.style.width = "500px";
                        renderingCanvas.style.height = "500px";
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < 5)) return [3 /*break*/, 4];
                        nCount = nodeCounts[i].toString();
                        eCount = edgeCounts[i].toString();
                        this.setState({ nodeCount: nCount });
                        this.setState({ edgeCount: eCount });
                        data = this.generateRandomData(nodeCounts, edgeCounts, i);
                        this.setState({ nodeData: data.nodes });
                        this.setState({ edgeData: data.edges });
                        // this.props.setNodeEdgeData(this.state.nodeData, this.state.edgeData);
                        return [4 /*yield*/, this.testFunc(data, stats)];
                    case 2:
                        // this.props.setNodeEdgeData(this.state.nodeData, this.state.edgeData);
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        i++;
                        return [3 /*break*/, 1];
                    case 4:
                        this.setState({ runBenchmark: false });
                        renderingCanvas.width = 800;
                        renderingCanvas.height = 800;
                        renderingCanvas.style.width = "800px";
                        renderingCanvas.style.height = "800px";
                        return [2 /*return*/];
                }
            });
        });
    };
    Sidebar.prototype.generatePair = function (min, max) {
        function randRange(min, max) {
            return min + Math.floor(Math.random() * (max - min));
        }
        var source = randRange(min, max);
        var target = randRange(min, max);
        while (source === target) {
            target = randRange(min, max);
        }
        return {
            source: source,
            target: target
        };
    };
    Sidebar.prototype.generateRandomData = function (nodeCounts, edgeCounts, stepCount) {
        var nodeCount = nodeCounts[stepCount];
        var edgeCount = edgeCounts[stepCount];
        var generatedData = this.generateRandomGraph(nodeCount, edgeCount);
        return generatedData;
    };
    Sidebar.prototype.generateRandomGraph = function (nodeCount, edgeCount) {
        var nodes = [];
        var edges = [];
        var data = {
            nodes: nodes,
            edges: edges
        };
        data.nodes = Array(4 * nodeCount).fill(0);
        for (var i = 0; i < 4 * nodeCount; i = i + 4) {
            data.nodes[i] = 0;
            data.nodes[i + 1] = Math.random();
            data.nodes[i + 2] = Math.random();
            data.nodes[i + 3] = 1;
        }
        var edgeHashMap = new Map();
        data.edges = Array(2 * edgeCount).fill(0);
        var pair;
        for (var i = 0; i < 2 * edgeCount; i = i + 2) {
            do {
                pair = this.generatePair(0, nodeCount);
            } while (edgeHashMap.has(pair.source + "_" + pair.target));
            edgeHashMap.set(pair.source + "_" + pair.target, true);
            edgeHashMap.set(pair.target + "_" + pair.source, true);
            data.edges[i] = pair.source;
            data.edges[i + 1] = pair.target;
        }
        return data;
    };
    Sidebar.prototype.refresh = function (length) {
        var nodes = [];
        for (var i = 0; i < 4 * length; i = i + 4) {
            nodes[i + 1] = Math.random();
            nodes[i + 2] = Math.random();
        }
        this.setState({ nodeData: nodes });
        this.props.setNodeEdgeData(nodes, this.state.edgeData);
    };
    Sidebar.prototype.storeFPSResult = function (nodeLength, edgeLength, fps) {
        nodeLength = nodeLength.toString();
        edgeLength = edgeLength.toString();
        fps = fps.toString();
        this.setState({
            FPSData: __spreadArrays(this.state.FPSData, [[nodeLength, edgeLength, fps]])
        });
        console.log(this.state.FPSData);
    };
    Sidebar.prototype.testFunc = function (data, stats) {
        return __awaiter(this, void 0, void 0, function () {
            var nodeLength, edgeLength;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        nodeLength = data.nodes.length / 4;
                        edgeLength = data.edges.length / 2;
                        return [4 /*yield*/, this.runTest(nodeLength, edgeLength, stats)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Sidebar.prototype.runTest = function (nodeLength, edgeLength, stats) {
        return __awaiter(this, void 0, void 0, function () {
            var requestId, refreshing, FPS_Array, FPS;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        refreshing = function () {
                            stats.begin();
                            _this.refresh(nodeLength);
                            stats.end();
                            requestId = requestAnimationFrame(refreshing);
                        };
                        refreshing();
                        return [4 /*yield*/, this.sleep(Constant.TIME_FOR_EACH_TEST)];
                    case 1:
                        _a.sent();
                        FPS_Array = stats.getFPSHistory();
                        console.log(FPS_Array);
                        FPS = FPS_Array.pop();
                        this.storeFPSResult(nodeLength, edgeLength, FPS);
                        cancelAnimationFrame(requestId);
                        return [2 /*return*/];
                }
            });
        });
    };
    Sidebar.prototype.readFiles = function (event) {
        var _this = this;
        var files = event.target.files;
        console.log(files);
        var nodeIDToValue = {};
        // var nodeIDToPos = {};
        var nodeIDToIndex = {};
        var nodeData = [];
        var edgeData = [];
        var degreeMatrix = [];
        var adjacencyMatrix = [];
        var edgeReader = new FileReader();
        edgeReader.onload = function (event) {
            var edgeRaw = edgeReader.result.split("\n");
            for (var _i = 0, edgeRaw_1 = edgeRaw; _i < edgeRaw_1.length; _i++) {
                var element = edgeRaw_1[_i];
                var parts = element.split("\t");
                if (nodeIDToValue[parts[0]] && nodeIDToValue[parts[1]]) {
                    edgeData.push(nodeIDToIndex[parts[0]], nodeIDToIndex[parts[1]]);
                    degreeMatrix[nodeIDToIndex[parts[0]]][nodeIDToIndex[parts[0]]] += 1;
                    degreeMatrix[nodeIDToIndex[parts[1]]][nodeIDToIndex[parts[1]]] += 1;
                    adjacencyMatrix[nodeIDToIndex[parts[0]]][nodeIDToIndex[parts[1]]] += 1;
                    adjacencyMatrix[nodeIDToIndex[parts[1]]][nodeIDToIndex[parts[0]]] += 1;
                }
            }
            _this.setState({ edgeData: edgeData });
            var laplacian = mathjs_1.subtract(mathjs_1.sparse(degreeMatrix), mathjs_1.sparse(adjacencyMatrix));
            console.log(laplacian);
            _this.setState({ laplacian: laplacian, adjacencyMatrix: adjacencyMatrix });
        };
        var layoutReader = new FileReader();
        layoutReader.onload = function (event) {
            var layoutData = layoutReader.result.split("\n");
            for (var _i = 0, layoutData_1 = layoutData; _i < layoutData_1.length; _i++) {
                var element = layoutData_1[_i];
                var parts = element.split("\t");
                if (nodeIDToValue[parts[0]]) {
                    nodeIDToIndex[parts[0]] = nodeData.length / 4;
                    // Pushes values to node data in order of struct for WebGPU:
                    // nodeValue, nodeX, nodeY, nodeSize
                    nodeData.push(parseFloat(nodeIDToValue[parts[0]]), parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
                    // nodeIDToPos[parts[0]] = [parseFloat(parts[1]) * 2.0 - 1, parseFloat(parts[2]) * 2.0 - 1];
                }
            }
            _this.setState({ nodeData: nodeData });
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
        var nodeReader = new FileReader();
        nodeReader.onload = function (event) {
            var rawNodes = nodeReader.result.split("\n");
            for (var _i = 0, rawNodes_1 = rawNodes; _i < rawNodes_1.length; _i++) {
                var element = rawNodes_1[_i];
                nodeIDToValue[element.split("\t")[0]] = element.split("\t")[1];
            }
            console.log(nodeIDToValue);
            layoutReader.readAsText(files[1]);
        };
        nodeReader.readAsText(files[0]);
    };
    Sidebar.prototype.readJson = function (event) {
        var _this = this;
        var files = event.target.files;
        var jsonReader = new FileReader();
        var nodeData = [];
        var edgeData = [];
        jsonReader.onload = function (event) {
            var graph = JSON.parse(jsonReader.result);
            console.log(graph);
            for (var i = 0; i < graph.nodes.length; i++) {
                if (graph.nodes[i].x) {
                    nodeData.push(0.0, graph.nodes[i].x, graph.nodes[i].y, 1.0);
                }
                else {
                    nodeData.push(0.0, Math.random(), Math.random(), 1.0);
                }
            }
            for (var i = 0; i < graph.edges.length; i++) {
                var source = graph.edges[i].source;
                var target = graph.edges[i].target;
                edgeData.push(source, target);
            }
            _this.setState({ nodeData: nodeData, edgeData: edgeData });
        };
        jsonReader.readAsText(files[0]);
    };
    Sidebar.prototype.applySpectral = function () {
        var e = mathjs_1.eigs(this.state.laplacian);
        console.log(e);
        var nodeData = this.state.nodeData;
        var x = mathjs_1.column(e.vectors, 1);
        var y = mathjs_1.column(e.vectors, 2);
        var x_max = mathjs_1.max(x);
        var y_max = mathjs_1.max(y);
        var x_min = mathjs_1.min(x);
        var y_min = mathjs_1.min(y);
        for (var i = 0; i < nodeData.length / 4; i++) {
            nodeData[i * 4 + 1] = (x.get([i, 0]) - x_min) / (x_max - x_min);
            nodeData[i * 4 + 2] = (y.get([i, 0]) - y_min) / (y_max - y_min);
        }
        this.setState({ nodeData: nodeData });
        this.props.setNodeEdgeData(nodeData, this.state.edgeData);
    };
    Sidebar.prototype.onSaveXML = function () {
        var xw = new xml_writer_1["default"](true);
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
        var element = document.createElement("a");
        var file = new Blob([xw.toString()], { type: "application/xml" });
        element.href = URL.createObjectURL(file);
        element.download = "terrain.xml";
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
    };
    Sidebar.prototype.render = function () {
        var _this = this;
        return (react_1["default"].createElement("div", { className: "sidebar" },
            react_1["default"].createElement("hr", null),
            react_1["default"].createElement(react_bootstrap_1.Button, { className: "benchmark_test", onClick: this.runBenchmark }, "Run Benchmark"),
            react_1["default"].createElement("div", { style: { margin: 10, color: "white" } },
                react_1["default"].createElement("p", null,
                    "Node count: ",
                    this.state.nodeCount),
                react_1["default"].createElement("p", null,
                    "Edge count: ",
                    this.state.edgeCount)),
            react_1["default"].createElement(react_csv_1.CSVLink, { data: this.state.FPSData }, "Download FPS data"),
            react_1["default"].createElement("hr", null),
            react_1["default"].createElement(react_bootstrap_1.Button, { className: "d3Timing_test", onClick: this.d3TimingStudy }, "Run D3"),
            react_1["default"].createElement(react_bootstrap_1.Form, { style: { color: "white" }, onSubmit: this.handleSubmit },
                react_1["default"].createElement(react_bootstrap_1.Form.Group, { controlId: "formFile", className: "mt-3 mb-3" },
                    react_1["default"].createElement(react_bootstrap_1.Form.Check, { defaultChecked: true, onClick: function () {
                            return _this.setState({ jsonFormat: !_this.state.jsonFormat });
                        }, type: "checkbox", label: "Json Format" }),
                    react_1["default"].createElement(react_bootstrap_1.Form.Label, null, "Select Example Files"),
                    react_1["default"].createElement(react_bootstrap_1.Form.Control, { className: "form-control", type: "file", multiple: true, onChange: function (e) {
                            if (_this.state.jsonFormat) {
                                _this.readJson(e);
                            }
                            else {
                                _this.readFiles(e);
                            }
                        } }),
                    react_1["default"].createElement(react_bootstrap_1.Button, { className: "mt-2", type: "submit", variant: "secondary", value: "Submit" }, "Submit")),
                react_1["default"].createElement(react_collapsible_1["default"], { trigger: "Terrain Options" },
                    react_1["default"].createElement(react_bootstrap_1.Form.Group, null,
                        react_1["default"].createElement(react_bootstrap_1.Form.Label, null, " Width Factor "),
                        react_1["default"].createElement("br", null),
                        react_1["default"].createElement("input", { type: "range", defaultValue: 1000, min: 0, max: 2000, onChange: function (e) {
                                return _this.props.setWidthFactor(parseFloat(e.target.value));
                            } })),
                    react_1["default"].createElement(react_bootstrap_1.Form.Group, null,
                        react_1["default"].createElement(react_bootstrap_1.Form.Label, null, " Peak and Valley Values "),
                        react_1["default"].createElement("br", null),
                        react_1["default"].createElement("input", { type: "range", defaultValue: 0.8, min: 0.5, max: 1, step: 0.01, onChange: function (e) {
                                return _this.props.setPeakValue(parseFloat(e.target.value));
                            } }),
                        react_1["default"].createElement("input", { type: "range", defaultValue: 0.2, min: 0, max: 0.5, step: 0.01, onChange: function (e) {
                                return _this.props.setValleyValue(parseFloat(e.target.value));
                            } })),
                    react_1["default"].createElement(react_bootstrap_1.Form.Group, null,
                        react_1["default"].createElement(react_bootstrap_1.Form.Check, { defaultChecked: true, onClick: function (e) { return _this.props.setGlobalRange(); }, type: "checkbox", label: "Use Global Min/Max" }))),
                react_1["default"].createElement(react_collapsible_1["default"], { trigger: "Colormap Options" },
                    react_1["default"].createElement(react_bootstrap_1.Form.Row, null,
                        react_1["default"].createElement("div", null, "Valley"),
                        react_1["default"].createElement("input", { type: "range", defaultValue: 45, min: 1, max: 60, step: 1, onChange: function (e) {
                                return _this.props.setColorValley(parseFloat(e.target.value));
                            } })),
                    react_1["default"].createElement(react_bootstrap_1.Form.Row, null,
                        react_1["default"].createElement("div", null, "Hill"),
                        react_1["default"].createElement("input", { type: "range", defaultValue: 90, min: 61, max: 120, step: 1, onChange: function (e) {
                                return _this.props.setColorHill(parseFloat(e.target.value));
                            } })),
                    react_1["default"].createElement(react_bootstrap_1.Form.Row, null,
                        react_1["default"].createElement("div", null, "Mountain"),
                        react_1["default"].createElement("input", { type: "range", defaultValue: 135, min: 121, max: 180, step: 1, onChange: function (e) {
                                return _this.props.setColorMountain(parseFloat(e.target.value));
                            } }))),
                react_1["default"].createElement(react_collapsible_1["default"], { trigger: "Layers" },
                    react_1["default"].createElement(react_bootstrap_1.Form.Check, { defaultChecked: false, onClick: function (e) { return _this.props.toggleTerrainLayer(); }, type: "checkbox", label: "Terrain Layer" }),
                    react_1["default"].createElement(react_bootstrap_1.Form.Check, { defaultChecked: true, onClick: function (e) { return _this.props.toggleNodeLayer(); }, type: "checkbox", label: "Node Layer" }),
                    react_1["default"].createElement(react_bootstrap_1.Form.Check, { defaultChecked: true, onClick: function (e) { return _this.props.toggleEdgeLayer(); }, type: "checkbox", label: "Edge Layer" })),
                react_1["default"].createElement(react_collapsible_1["default"], { trigger: "Force Directed Options" },
                    react_1["default"].createElement(react_bootstrap_1.Form.Label, null, " Ideal Length and Cooling Factor "),
                    react_1["default"].createElement("br", null),
                    react_1["default"].createElement("input", { type: "range", defaultValue: 0.05, min: 0.001, max: 0.1, step: 0.001, onChange: function (e) {
                            return _this.props.setIdealLength(parseFloat(e.target.value));
                        } }),
                    react_1["default"].createElement("input", { type: "range", defaultValue: 0.9, min: 0.75, max: 0.999, step: 0.001, onChange: function (e) {
                            return _this.props.setCoolingFactor(parseFloat(e.target.value));
                        } })),
                react_1["default"].createElement(react_bootstrap_1.Button, { onClick: function (e) { return _this.props.onSave(); } }, "Save Terrain"),
                react_1["default"].createElement("br", null),
                react_1["default"].createElement(react_bootstrap_1.Button, { onClick: function (e) { return _this.applySpectral(); } }, "Apply Spectral Layout"),
                react_1["default"].createElement("br", null),
                react_1["default"].createElement(react_bootstrap_1.Button, { onClick: function (e) { return _this.props.runForceDirected(); } }, "Run Force Directed Layout"),
                react_1["default"].createElement("br", null),
                react_1["default"].createElement(react_bootstrap_1.Button, { onClick: function (e) { return _this.onSaveXML(); } }, "Save Terrain to XML"))));
    };
    return Sidebar;
}(react_1["default"].Component));
exports["default"] = Sidebar;

//# sourceMappingURL=Sidebar.js.map
