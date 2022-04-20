"use strict";
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
exports.__esModule = true;
var wgsl_1 = require("./wgsl");
var ForceDirected = /** @class */ (function () {
    function ForceDirected(device) {
        this.coolingFactor = 0.9;
        this.iterationCount = 10000;
        this.threshold = 100;
        this.force = 1000.0;
        this.device = device;
        this.nodeDataBuffer = this.device.createBuffer({
            size: 16,
            usage: GPUBufferUsage.STORAGE |
                GPUBufferUsage.COPY_DST |
                GPUBufferUsage.COPY_SRC
        });
        this.edgeDataBuffer = this.device.createBuffer({
            size: 16,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });
        this.adjMatrixBuffer = this.device.createBuffer({
            size: 16,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });
        this.laplacianBuffer = this.device.createBuffer({
            size: 16,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });
        this.forceDataBuffer = this.device.createBuffer({
            size: 16,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
        });
        this.createMatrixPipeline = device.createComputePipeline({
            compute: {
                module: device.createShaderModule({
                    code: wgsl_1.create_adjacency_matrix
                }),
                entryPoint: "main"
            }
        });
        this.createQuadTreePipeline = device.createComputePipeline({
            compute: {
                module: device.createShaderModule({
                    code: wgsl_1.create_quadtree
                }),
                entryPoint: "main"
            }
        });
        this.computeForcesPipeline = device.createComputePipeline({
            compute: {
                module: device.createShaderModule({
                    code: wgsl_1.compute_forces
                }),
                entryPoint: "main"
            }
        });
        this.applyForcesPipeline = device.createComputePipeline({
            compute: {
                module: device.createShaderModule({
                    code: wgsl_1.apply_forces
                }),
                entryPoint: "main"
            }
        });
        // Create a buffer to store the params, output, and min/max
        this.paramsBuffer = device.createBuffer({
            size: 4 * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        this.positionReadBuffer = null;
    }
    ForceDirected.prototype.formatToD3Format = function (positionList, edgeList, nLength, eLength) {
        var nodeLength = positionList.length;
        var nodeArray1 = new Array(nLength);
        var edgeArray1 = new Array(eLength);
        for (var i = 0; i < 4 * nodeLength; i = i + 4) {
            nodeArray1[i / 4] = {};
            nodeArray1[i / 4].index = i / 4;
            nodeArray1[i / 4].name = (i / 4).toString();
            nodeArray1[i / 4].x = positionList[i + 1];
            nodeArray1[i / 4].y = positionList[i + 2];
        }
        for (var i = 0; i < eLength; i = i + 2) {
            edgeArray1[i / 2] = {};
            var sourceIndex = edgeList[i];
            var targetIndex = edgeList[i + 1];
            edgeArray1[i / 2].index = i / 2;
            edgeArray1[i / 2].source = {};
            edgeArray1[i / 2].source.index = sourceIndex;
            edgeArray1[i / 2].source.name = sourceIndex.toString();
            edgeArray1[i / 2].source.x = nodeArray1[sourceIndex].x;
            edgeArray1[i / 2].source.y = nodeArray1[sourceIndex].y;
            edgeArray1[i / 2].target = {};
            edgeArray1[i / 2].target.index = targetIndex;
            edgeArray1[i / 2].target.name = targetIndex.toString();
            edgeArray1[i / 2].target.x = nodeArray1[targetIndex].x;
            edgeArray1[i / 2].target.y = nodeArray1[targetIndex].y;
        }
        return {
            nodeArray: nodeArray1,
            edgeArray: edgeArray1
        };
    };
    ForceDirected.prototype.runForces = function (nodeDataBuffer, edgeDataBuffer, nodeLength, edgeLength, coolingFactor, l, iterationCount, threshold, iterRef, edgeList) {
        if (nodeDataBuffer === void 0) { nodeDataBuffer = this.nodeDataBuffer; }
        if (edgeDataBuffer === void 0) { edgeDataBuffer = this.edgeDataBuffer; }
        if (nodeLength === void 0) { nodeLength = 0; }
        if (edgeLength === void 0) { edgeLength = 0; }
        if (coolingFactor === void 0) { coolingFactor = this.coolingFactor; }
        if (l === void 0) { l = 0.05; }
        if (iterationCount === void 0) { iterationCount = this.iterationCount; }
        if (threshold === void 0) { threshold = this.threshold; }
        return __awaiter(this, void 0, void 0, function () {
            var upload, mapping, adjMatrixSize, commandEncoder, createBindGroup, pass, gpuReadBuffer, arrayBuffer, output, count, iterationTimes, totalStart, applyBindGroup, upload, mapping, commandEncoder, bindGroup, pass, pass, start, end, positionArrayBuffer, positionList, d3Format, formattednodeList, formattedEdgeList, totalEnd, iterAvg;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (nodeLength == 0 || edgeLength == 0) {
                            return [2 /*return*/];
                        }
                        console.log(l);
                        console.log(coolingFactor);
                        this.coolingFactor = coolingFactor;
                        this.nodeDataBuffer = nodeDataBuffer;
                        this.edgeDataBuffer = edgeDataBuffer;
                        this.threshold = threshold;
                        this.force = 100000;
                        upload = this.device.createBuffer({
                            size: 4 * 4,
                            usage: GPUBufferUsage.COPY_SRC,
                            mappedAtCreation: true
                        });
                        mapping = upload.getMappedRange();
                        new Uint32Array(mapping).set([nodeLength, edgeLength]);
                        new Float32Array(mapping).set([this.coolingFactor, l], 2);
                        upload.unmap();
                        adjMatrixSize = Math.ceil((nodeLength * nodeLength * 4) / 32);
                        this.adjMatrixBuffer = this.device.createBuffer({
                            size: adjMatrixSize,
                            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
                        });
                        this.laplacianBuffer = this.device.createBuffer({
                            size: nodeLength * nodeLength * 4,
                            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
                        });
                        commandEncoder = this.device.createCommandEncoder();
                        commandEncoder.copyBufferToBuffer(upload, 0, this.paramsBuffer, 0, 4 * 4);
                        createBindGroup = this.device.createBindGroup({
                            layout: this.createMatrixPipeline.getBindGroupLayout(0),
                            entries: [
                                {
                                    binding: 0,
                                    resource: {
                                        buffer: this.edgeDataBuffer
                                    }
                                },
                                {
                                    binding: 1,
                                    resource: {
                                        buffer: this.adjMatrixBuffer
                                    }
                                },
                                {
                                    binding: 2,
                                    resource: {
                                        buffer: this.paramsBuffer
                                    }
                                },
                                {
                                    binding: 3,
                                    resource: {
                                        buffer: this.laplacianBuffer
                                    }
                                },
                            ]
                        });
                        pass = commandEncoder.beginComputePass();
                        pass.setBindGroup(0, createBindGroup);
                        pass.setPipeline(this.createMatrixPipeline);
                        pass.dispatch(1, 1, 1);
                        pass.endPass();
                        gpuReadBuffer = this.device.createBuffer({
                            size: nodeLength * nodeLength * 4,
                            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
                        });
                        // Encode commands for copying buffer to buffer.
                        commandEncoder.copyBufferToBuffer(this.adjMatrixBuffer /* source buffer */, 0 /* source offset */, gpuReadBuffer /* destination buffer */, 0 /* destination offset */, adjMatrixSize /* size */);
                        this.device.queue.submit([commandEncoder.finish()]);
                        // Log adjacency matrix (count should be equal to the number of nonduplicate edges)
                        return [4 /*yield*/, gpuReadBuffer.mapAsync(GPUMapMode.READ)];
                    case 1:
                        // Log adjacency matrix (count should be equal to the number of nonduplicate edges)
                        _a.sent();
                        arrayBuffer = gpuReadBuffer.getMappedRange();
                        output = new Int32Array(arrayBuffer);
                        count = 0;
                        // for (var i = 0; i < output.length; i++) {
                        //     count+=output[i];
                        // }
                        console.log(output);
                        console.log(count);
                        console.log(output.length);
                        this.forceDataBuffer = this.device.createBuffer({
                            size: nodeLength * 2 * 4,
                            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
                        });
                        iterationTimes = [];
                        totalStart = performance.now();
                        applyBindGroup = this.device.createBindGroup({
                            layout: this.applyForcesPipeline.getBindGroupLayout(0),
                            entries: [
                                {
                                    binding: 0,
                                    resource: {
                                        buffer: this.nodeDataBuffer
                                    }
                                },
                                {
                                    binding: 1,
                                    resource: {
                                        buffer: this.forceDataBuffer
                                    }
                                },
                            ]
                        });
                        _a.label = 2;
                    case 2:
                        if (!(iterationCount > 0 &&
                            this.coolingFactor > 0.0001 &&
                            this.force >= 0)) return [3 /*break*/, 5];
                        iterationCount--;
                        upload = this.device.createBuffer({
                            size: 4 * 4,
                            usage: GPUBufferUsage.COPY_SRC,
                            mappedAtCreation: true
                        });
                        mapping = upload.getMappedRange();
                        new Uint32Array(mapping).set([nodeLength, edgeLength]);
                        new Float32Array(mapping).set([this.coolingFactor, l], 2);
                        upload.unmap();
                        commandEncoder = this.device.createCommandEncoder();
                        //commandEncoder.writeTimestamp();
                        commandEncoder.copyBufferToBuffer(upload, 0, this.paramsBuffer, 0, 4 * 4);
                        bindGroup = this.device.createBindGroup({
                            layout: this.computeForcesPipeline.getBindGroupLayout(0),
                            entries: [
                                {
                                    binding: 0,
                                    resource: {
                                        buffer: this.nodeDataBuffer
                                    }
                                },
                                {
                                    binding: 1,
                                    resource: {
                                        buffer: this.adjMatrixBuffer
                                    }
                                },
                                {
                                    binding: 2,
                                    resource: {
                                        buffer: this.forceDataBuffer
                                    }
                                },
                                {
                                    binding: 3,
                                    resource: {
                                        buffer: this.paramsBuffer
                                    }
                                },
                            ]
                        });
                        pass = commandEncoder.beginComputePass();
                        pass.setBindGroup(0, bindGroup);
                        pass.setPipeline(this.computeForcesPipeline);
                        pass.dispatch(nodeLength, 1, 1);
                        pass.endPass();
                        pass = commandEncoder.beginComputePass();
                        //commandEncoder.writeTimestamp();
                        // Run apply forces pass
                        pass.setBindGroup(0, applyBindGroup);
                        pass.setPipeline(this.applyForcesPipeline);
                        pass.dispatch(nodeLength, 1, 1);
                        pass.endPass();
                        this.positionReadBuffer = this.device.createBuffer({
                            size: nodeLength * 4 * 4,
                            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
                        });
                        commandEncoder.copyBufferToBuffer(this.nodeDataBuffer, 0, this.positionReadBuffer, 0, nodeLength * 4 * 4);
                        return [4 /*yield*/, this.device.queue.submit([commandEncoder.finish()])];
                    case 3:
                        _a.sent();
                        start = performance.now();
                        return [4 /*yield*/, this.device.queue.onSubmittedWorkDone()];
                    case 4:
                        _a.sent();
                        end = performance.now();
                        console.log("iteration time " + (end - start));
                        iterationTimes.push(end - start);
                        // this.maxForceResultBuffer.unmap();
                        // Read all of the forces applied.
                        // await gpuReadBuffer.mapAsync(GPUMapMode.READ);
                        // const arrayBuffer = gpuReadBuffer.getMappedRange();
                        // var output = new Float32Array(arrayBuffer);
                        // console.log(output);
                        this.coolingFactor = this.coolingFactor * coolingFactor;
                        return [3 /*break*/, 2];
                    case 5: return [4 /*yield*/, this.positionReadBuffer.mapAsync(GPUMapMode.READ)];
                    case 6:
                        _a.sent();
                        positionArrayBuffer = this.positionReadBuffer.getMappedRange();
                        positionList = new Float32Array(positionArrayBuffer);
                        d3Format = this.formatToD3Format(positionList, edgeList, nodeLength, edgeLength);
                        formattednodeList = d3Format.nodeArray;
                        formattedEdgeList = d3Format.edgeArray;
                        console.log(formattednodeList, formattedEdgeList);
                        totalEnd = performance.now();
                        iterAvg = iterationTimes.reduce(function (a, b) {
                            return a + b;
                        }) / iterationTimes.length;
                        iterRef.current.innerText = "Completed in " + iterationTimes.length + " iterations with total time " + (totalEnd - totalStart) + " and average iteration time " + iterAvg;
                        return [2 /*return*/];
                }
            });
        });
    };
    return ForceDirected;
}());
exports["default"] = ForceDirected;

//# sourceMappingURL=force_directed.js.map
