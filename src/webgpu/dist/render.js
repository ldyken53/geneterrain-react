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
var ez_canvas_controller_1 = require("./ez_canvas_controller");
var terrain_generator_1 = require("./terrain_generator");
var wgsl_1 = require("./wgsl");
var file_saver_1 = require("file-saver");
var force_directed_1 = require("./force_directed");
var Renderer = /** @class */ (function () {
    function Renderer(adapter, device, canvasRef, colormap, colormapImage, outCanvasRef, fpsRef, iterRef) {
        this.uniform2DBuffer = null;
        this.terrainGenerator = null;
        this.forceDirected = null;
        this.bindGroup2D = null;
        this.nodeBindGroup = null;
        this.edgeBindGroup = null;
        this.nodeDataBuffer = null;
        this.edgeDataBuffer = null;
        this.colorTexture = null;
        this.viewBoxBuffer = null;
        this.nodePipeline = null;
        this.edgePipeline = null;
        this.nodeLength = 1;
        this.edgeLength = 1;
        this.rangeBuffer = null;
        this.nodeToggle = true;
        this.terrainToggle = false;
        this.edgeToggle = true;
        this.canvasSize = null;
        this.idealLength = 0.05;
        this.coolingFactor = 0.9;
        this.iterRef = iterRef;
        this.colormapImage = colormapImage;
        this.outCanvasRef = outCanvasRef;
        this.device = device;
        // Check that canvas is active
        if (canvasRef.current === null)
            return;
        var context = canvasRef.current.getContext("webgpu");
        var devicePixelRatio = window.devicePixelRatio || 1;
        var presentationSize = [
            canvasRef.current.clientWidth * devicePixelRatio,
            canvasRef.current.clientHeight * devicePixelRatio,
        ];
        var presentationFormat = context.getPreferredFormat(adapter);
        this.canvasSize = [canvasRef.current.width, canvasRef.current.height];
        context.configure({
            device: device,
            format: presentationFormat,
            size: presentationSize
        });
        this.edgeDataBuffer = device.createBuffer({
            size: 4 * 4,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true
        });
        var edgeData = [0, 0, 0.01, 0.01];
        new Float32Array(this.edgeDataBuffer.getMappedRange()).set(edgeData);
        this.edgeDataBuffer.unmap();
        // setting it to some trivial data so that it won't fail the pipeline before edge data is available
        this.edgePipeline = device.createRenderPipeline({
            vertex: {
                module: device.createShaderModule({
                    code: wgsl_1.edge_vert
                }),
                entryPoint: "main",
                buffers: [
                    {
                        arrayStride: 2 * 4 * 1,
                        attributes: [
                            {
                                format: "float32x2",
                                offset: 0,
                                shaderLocation: 0
                            },
                        ]
                    },
                ]
            },
            fragment: {
                module: device.createShaderModule({
                    code: wgsl_1.edge_frag
                }),
                entryPoint: "main",
                targets: [
                    {
                        format: presentationFormat,
                        blend: {
                            color: {
                                srcFactor: "one",
                                dstFactor: "one-minus-src-alpha"
                            },
                            alpha: {
                                srcFactor: "one",
                                dstFactor: "one-minus-src-alpha"
                            }
                        }
                    },
                ]
            },
            primitive: {
                topology: "line-list"
            },
            multisample: {
                count: 4
            }
        });
        this.rangeBuffer = this.device.createBuffer({
            size: 2 * 4,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
        });
        var nodePositionBuffer = device.createBuffer({
            size: 6 * 2 * 4,
            usage: GPUBufferUsage.VERTEX,
            mappedAtCreation: true
        });
        new Float32Array(nodePositionBuffer.getMappedRange()).set([
            1, -1, -1, -1, -1, 1, 1, -1, -1, 1, 1, 1,
        ]);
        nodePositionBuffer.unmap();
        var edgePositionBuffer = device.createBuffer({
            size: 2 * 2 * 4,
            usage: GPUBufferUsage.VERTEX,
            mappedAtCreation: true
        });
        new Float32Array(edgePositionBuffer.getMappedRange()).set([0, 0, 1, 1]);
        edgePositionBuffer.unmap();
        this.nodeDataBuffer = device.createBuffer({
            size: 4 * 4,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true
        });
        new Float32Array(this.nodeDataBuffer.getMappedRange()).set([
            0.5, 0.5, 0.5, 0.5,
        ]);
        this.nodeDataBuffer.unmap();
        this.nodePipeline = device.createRenderPipeline({
            vertex: {
                module: device.createShaderModule({
                    code: wgsl_1.node_vert
                }),
                entryPoint: "main",
                buffers: [
                    {
                        arrayStride: 2 * 4,
                        attributes: [
                            {
                                format: "float32x2",
                                offset: 0,
                                shaderLocation: 0
                            },
                        ]
                    },
                ]
            },
            fragment: {
                module: device.createShaderModule({
                    code: wgsl_1.node_frag
                }),
                entryPoint: "main",
                targets: [
                    {
                        format: presentationFormat,
                        blend: {
                            color: {
                                srcFactor: "one",
                                dstFactor: "one-minus-src-alpha"
                            },
                            alpha: {
                                srcFactor: "one",
                                dstFactor: "one-minus-src-alpha"
                            }
                        }
                    },
                ]
            },
            primitive: {
                topology: "triangle-list"
            },
            multisample: {
                count: 4
            }
        });
        var pipeline = device.createRenderPipeline({
            vertex: {
                module: device.createShaderModule({
                    code: wgsl_1.display_2d_vert
                }),
                entryPoint: "main",
                buffers: [
                    {
                        arrayStride: 4 * 4,
                        attributes: [
                            {
                                format: "float32x4",
                                offset: 0,
                                shaderLocation: 0
                            },
                        ]
                    },
                ]
            },
            fragment: {
                module: device.createShaderModule({
                    code: wgsl_1.display_2d_frag
                }),
                entryPoint: "main",
                targets: [
                    {
                        format: presentationFormat
                    },
                ]
            },
            primitive: {
                topology: "triangle-list"
            },
            multisample: {
                count: 4
            }
        });
        // Vertices to render
        var dataBuf2D = device.createBuffer({
            size: 6 * 4 * 4,
            usage: GPUBufferUsage.VERTEX,
            mappedAtCreation: true
        });
        new Float32Array(dataBuf2D.getMappedRange()).set([
            1,
            -1,
            0,
            1,
            -1,
            -1,
            0,
            1,
            -1,
            1,
            0,
            1,
            1,
            -1,
            0,
            1,
            -1,
            1,
            0,
            1,
            1,
            1,
            0,
            1,
        ]);
        dataBuf2D.unmap();
        // Set up uniform buffers for bind group
        this.uniform2DBuffer = device.createBuffer({
            size: 2 * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        device.queue.writeBuffer(this.uniform2DBuffer, 0, new Float32Array([0.8, 0.2]), 0, 2);
        var imageSizeBuffer = device.createBuffer({
            size: 2 * 4,
            usage: GPUBufferUsage.UNIFORM,
            mappedAtCreation: true
        });
        new Uint32Array(imageSizeBuffer.getMappedRange()).set(this.canvasSize);
        imageSizeBuffer.unmap();
        // Load colormap texture
        this.colorTexture = device.createTexture({
            size: [colormap.width, colormap.height, 1],
            format: "rgba8unorm",
            usage: GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.RENDER_ATTACHMENT
        });
        device.queue.copyExternalImageToTexture({ source: colormap }, { texture: this.colorTexture }, [colormap.width, colormap.height, 1]);
        this.terrainGenerator = new terrain_generator_1["default"](device, this.canvasSize[0], this.canvasSize[1]);
        this.forceDirected = new force_directed_1["default"](device);
        this.bindGroup2D = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: this.colorTexture.createView()
                },
                {
                    binding: 1,
                    resource: {
                        buffer: this.terrainGenerator.pixelValueBuffer
                    }
                },
                {
                    binding: 2,
                    resource: {
                        buffer: this.uniform2DBuffer
                    }
                },
                {
                    binding: 3,
                    resource: {
                        buffer: imageSizeBuffer
                    }
                },
            ]
        });
        this.viewBoxBuffer = device.createBuffer({
            size: 4 * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        device.queue.writeBuffer(this.viewBoxBuffer, 0, new Float32Array([0, 0, 1, 1]), 0, 4);
        var translation = [0, 0, 1, 1];
        var newTranslation = [0, 0, 1, 1];
        var controller = new ez_canvas_controller_1.Controller();
        var terrainGenerator = this.terrainGenerator;
        var render = this;
        controller.mousemove = function (prev, cur, evt) {
            if (evt.buttons == 1) {
                var change = [
                    ((cur[0] - prev[0]) * (translation[2] - translation[0])) /
                        render.canvasSize[0],
                    ((prev[1] - cur[1]) * (translation[3] - translation[1])) /
                        render.canvasSize[1],
                ];
                newTranslation = [
                    newTranslation[0] - change[0],
                    newTranslation[1] - change[1],
                    newTranslation[2] - change[0],
                    newTranslation[3] - change[1],
                ];
                if (Math.abs(newTranslation[0] - translation[0]) >
                    0.03 * (translation[2] - translation[0]) ||
                    Math.abs(newTranslation[1] - translation[1]) >
                        0.03 * (translation[3] - translation[1])) {
                    translation = newTranslation;
                    if (render.terrainToggle) {
                        terrainGenerator.computeTerrain(undefined, undefined, translation, render.rangeBuffer, render.nodeLength);
                    }
                    device.queue.writeBuffer(render.viewBoxBuffer, 0, new Float32Array(translation), 0, 4);
                }
            }
        };
        controller.wheel = function (amt) {
            var change = [amt / 1000, amt / 1000];
            newTranslation = [
                newTranslation[0] + change[0],
                newTranslation[1] + change[1],
                newTranslation[2] - change[0],
                newTranslation[3] - change[1],
            ];
            if (newTranslation[2] - newTranslation[0] > 0.01 &&
                newTranslation[3] - newTranslation[1] > 0.01) {
                translation = newTranslation;
                if (render.terrainToggle) {
                    terrainGenerator.computeTerrain(undefined, undefined, translation, render.rangeBuffer, render.nodeLength);
                }
                device.queue.writeBuffer(render.viewBoxBuffer, 0, new Float32Array(translation), 0, 4);
            }
            else {
                newTranslation = translation;
            }
        };
        controller.registerForCanvas(canvasRef.current);
        this.nodeBindGroup = device.createBindGroup({
            layout: this.nodePipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.viewBoxBuffer
                    }
                },
                {
                    binding: 1,
                    resource: {
                        buffer: this.nodeDataBuffer
                    }
                },
            ]
        });
        this.edgeBindGroup = device.createBindGroup({
            layout: this.edgePipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.viewBoxBuffer
                    }
                },
                {
                    binding: 1,
                    resource: {
                        buffer: this.nodeDataBuffer
                    }
                },
                {
                    binding: 2,
                    resource: {
                        buffer: this.edgeDataBuffer
                    }
                },
            ]
        });
        var texture = device.createTexture({
            size: presentationSize,
            sampleCount: 4,
            format: presentationFormat,
            usage: GPUTextureUsage.RENDER_ATTACHMENT
        });
        var view = texture.createView();
        var render = this;
        var frameCount = 0;
        var timeToSecond = 1000;
        function frame() {
            return __awaiter(this, void 0, void 0, function () {
                var start, commandEncoder, renderPassDescriptor, passEncoder, end;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            start = performance.now();
                            // Sample is no longer the active page.
                            if (!canvasRef.current)
                                return [2 /*return*/];
                            commandEncoder = device.createCommandEncoder();
                            renderPassDescriptor = {
                                colorAttachments: [
                                    {
                                        view: view,
                                        resolveTarget: context.getCurrentTexture().createView(),
                                        loadValue: { r: 1.0, g: 1.0, b: 1.0, a: 1.0 },
                                        storeOp: "discard"
                                    },
                                ]
                            };
                            passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
                            if (render.terrainToggle) {
                                passEncoder.setPipeline(pipeline);
                                passEncoder.setVertexBuffer(0, dataBuf2D);
                                passEncoder.setBindGroup(0, render.bindGroup2D);
                                passEncoder.draw(6, 1, 0, 0);
                            }
                            if (render.edgeToggle) {
                                passEncoder.setPipeline(render.edgePipeline);
                                passEncoder.setVertexBuffer(0, edgePositionBuffer);
                                passEncoder.setBindGroup(0, render.edgeBindGroup);
                                passEncoder.draw(2, render.edgeLength, 0, 0);
                            }
                            if (render.nodeToggle) {
                                passEncoder.setPipeline(render.nodePipeline);
                                passEncoder.setVertexBuffer(0, nodePositionBuffer);
                                passEncoder.setBindGroup(0, render.nodeBindGroup);
                                passEncoder.draw(6, render.nodeLength, 0, 0);
                            }
                            passEncoder.endPass();
                            device.queue.submit([commandEncoder.finish()]);
                            return [4 /*yield*/, device.queue.onSubmittedWorkDone()];
                        case 1:
                            _a.sent();
                            console.log("rendering task finished for", render.edgeLength);
                            end = performance.now();
                            if (timeToSecond - (end - start) < 0) {
                                fpsRef.current.innerText = "FPS: " + frameCount;
                                timeToSecond = 1000 + (timeToSecond - (end - start));
                                frameCount = 0;
                            }
                            else {
                                timeToSecond -= end - start;
                            }
                            frameCount += 1;
                            requestAnimationFrame(frame);
                            return [2 /*return*/];
                    }
                });
            });
        }
        requestAnimationFrame(frame);
    }
    Renderer.prototype.setNodeEdgeData = function (nodeData, edgeData) {
        this.nodeDataBuffer = this.device.createBuffer({
            size: nodeData.length * 4,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true
        });
        new Float32Array(this.nodeDataBuffer.getMappedRange()).set(nodeData);
        this.nodeDataBuffer.unmap();
        this.edgeDataBuffer = this.device.createBuffer({
            size: edgeData.length * 4,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE,
            mappedAtCreation: true
        });
        new Uint32Array(this.edgeDataBuffer.getMappedRange()).set(edgeData);
        this.edgeDataBuffer.unmap();
        this.edgeBindGroup = this.device.createBindGroup({
            layout: this.edgePipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.viewBoxBuffer
                    }
                },
                {
                    binding: 1,
                    resource: {
                        buffer: this.nodeDataBuffer
                    }
                },
                {
                    binding: 2,
                    resource: {
                        buffer: this.edgeDataBuffer
                    }
                },
            ]
        });
        this.nodeBindGroup = this.device.createBindGroup({
            layout: this.nodePipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.viewBoxBuffer
                    }
                },
                {
                    binding: 1,
                    resource: {
                        buffer: this.nodeDataBuffer
                    }
                },
            ]
        });
        this.edgeLength = edgeData.length;
        this.nodeLength = nodeData.length / 4;
        // this.terrainGenerator!.computeTerrain(this.nodeDataBuffer, undefined, undefined, this.rangeBuffer, this.nodeLength);
    };
    Renderer.prototype.setWidthFactor = function (widthFactor) {
        this.terrainGenerator.computeTerrain(undefined, widthFactor, undefined, this.rangeBuffer, this.nodeLength);
    };
    Renderer.prototype.setPeakValue = function (value) {
        this.device.queue.writeBuffer(this.uniform2DBuffer, 0, new Float32Array([value]), 0, 1);
    };
    Renderer.prototype.setValleyValue = function (value) {
        this.device.queue.writeBuffer(this.uniform2DBuffer, 4, new Float32Array([value]), 0, 1);
    };
    Renderer.prototype.setCoolingFactor = function (value) {
        this.coolingFactor = value;
    };
    Renderer.prototype.setIdealLength = function (value) {
        this.idealLength = value;
    };
    Renderer.prototype.setGlobalRange = function () {
        if (this.rangeBuffer) {
            this.rangeBuffer = null;
        }
        else {
            this.rangeBuffer = this.device.createBuffer({
                size: 2 * 4,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
            });
        }
    };
    Renderer.prototype.runForceDirected = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.forceDirected.runForces(this.nodeDataBuffer, this.edgeDataBuffer, this.nodeLength, this.edgeLength, this.coolingFactor, this.idealLength, 10000, 100, this.iterRef);
                return [2 /*return*/];
            });
        });
    };
    Renderer.prototype.toggleTerrainLayer = function () {
        this.terrainToggle = !this.terrainToggle;
    };
    Renderer.prototype.toggleNodeLayer = function () {
        this.nodeToggle = !this.nodeToggle;
    };
    Renderer.prototype.toggleEdgeLayer = function () {
        this.edgeToggle = !this.edgeToggle;
    };
    Renderer.prototype.setColormap = function (colormap, colormapImage) {
        this.device.queue.copyExternalImageToTexture({ source: colormap }, { texture: this.colorTexture }, [colormap.width, colormap.height, 1]);
        this.colormapImage = colormapImage;
    };
    Renderer.prototype.onSave = function () {
        return __awaiter(this, void 0, void 0, function () {
            var height, width, gpuReadBuffer, commandEncoder, gpuCommands, arrayBuffer, output, context, colorData, imgData, i, j, index, colorIndex;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        height = this.outCanvasRef.current.height;
                        width = this.outCanvasRef.current.width;
                        gpuReadBuffer = this.device.createBuffer({
                            size: width * height * 4,
                            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
                        });
                        console.log(width, height);
                        commandEncoder = this.device.createCommandEncoder();
                        // Encode commands for copying buffer to buffer.
                        commandEncoder.copyBufferToBuffer(this.terrainGenerator.pixelValueBuffer /* source buffer */, 0 /* source offset */, gpuReadBuffer /* destination buffer */, 0 /* destination offset */, width * height * 4 /* size */);
                        gpuCommands = commandEncoder.finish();
                        this.device.queue.submit([gpuCommands]);
                        // Read buffer.
                        return [4 /*yield*/, gpuReadBuffer.mapAsync(GPUMapMode.READ)];
                    case 1:
                        // Read buffer.
                        _a.sent();
                        arrayBuffer = gpuReadBuffer.getMappedRange();
                        output = new Float32Array(arrayBuffer);
                        context = this.outCanvasRef.current.getContext("2d");
                        context.drawImage(this.colormapImage, 0, 0);
                        colorData = context.getImageData(0, 0, 180, 1).data;
                        imgData = context.createImageData(width, height);
                        for (i = 0; i < height; i++) {
                            for (j = 0; j < width; j++) {
                                index = j + i * width;
                                colorIndex = Math.trunc(output[j + (height - 1 - i) * width] * 180) * 4;
                                imgData.data[index * 4] = colorData[colorIndex];
                                imgData.data[index * 4 + 1] = colorData[colorIndex + 1];
                                imgData.data[index * 4 + 2] = colorData[colorIndex + 2];
                                imgData.data[index * 4 + 3] = colorData[colorIndex + 3];
                            }
                        }
                        context.putImageData(imgData, 0, 0);
                        this.outCanvasRef.current.toBlob(function (b) {
                            file_saver_1.saveAs(b, "terrain.png");
                        }, "image/png");
                        return [2 /*return*/];
                }
            });
        });
    };
    return Renderer;
}());
exports["default"] = Renderer;

//# sourceMappingURL=render.js.map
