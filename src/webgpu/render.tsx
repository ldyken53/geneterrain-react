import { Controller } from './ez_canvas_controller';
import TerrainGenerator from './terrain_generator';
import { display_2d_vert, display_2d_frag, node_vert, node_frag, edge_vert, edge_frag } from './wgsl';
import { saveAs } from 'file-saver'; 

class Renderer {
  public uniform2DBuffer : GPUBuffer | null = null;
  public terrainGenerator : TerrainGenerator | null = null;
  public device : GPUDevice;
  public bindGroup2D : GPUBindGroup | null = null;
  public nodeBindGroup : GPUBindGroup | null = null;
  public nodePositionBuffer : GPUBuffer | null = null;
  public edgeDataBuffer : GPUBuffer | null = null;
  public nodePipeline : GPURenderPipeline | null = null;
  public edgePipeline : GPURenderPipeline | null = null;
  public nodeLength : number = 1;
  public edgeVertexCount : number = 2;
  public rangeBuffer : GPUBuffer | null = null;
  public nodeToggle : boolean = true;
  public terrainToggle : boolean = false;
  public edgeToggle : boolean = true;
  public colormapImage : HTMLImageElement;
  public outCanvasRef : React.RefObject<HTMLCanvasElement>;
  public canvasSize : [number, number] | null = null;

  constructor(
    adapter : GPUAdapter, device : GPUDevice, 
    canvasRef : React.RefObject<HTMLCanvasElement>, 
    colormap : ImageBitmap, colormapImage : HTMLImageElement,
    outCanvasRef : React.RefObject<HTMLCanvasElement>, 
  ) {
    this.colormapImage = colormapImage;
    this.outCanvasRef = outCanvasRef
    this.device = device;
    // Check that canvas is active
    if (canvasRef.current === null) return;
    const context = canvasRef.current.getContext('webgpu')!;
  
    const devicePixelRatio = window.devicePixelRatio || 1;
    const presentationSize = [
      canvasRef.current.clientWidth * devicePixelRatio,
      canvasRef.current.clientHeight * devicePixelRatio,
    ];
    const presentationFormat = context.getPreferredFormat(adapter);
    this.canvasSize = [
      canvasRef.current.width,
      canvasRef.current.height
    ];
  
    context.configure({
      device,
      format: presentationFormat,
      size: presentationSize,
    });

    this.edgeDataBuffer = device.createBuffer({
      size: 4 * 4,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true
    });

    let edgeData = [0, 0, 0.01, 0.01];
    new Float32Array(this.edgeDataBuffer.getMappedRange()).set(edgeData);
    this.edgeDataBuffer.unmap();

    // setting it to some trivial data so that it won't fail the pipeline before edge data is available

    this.edgePipeline = device.createRenderPipeline({
      vertex: {
        module: device.createShaderModule({
          code: edge_vert
        }),
        entryPoint: "main",
        buffers:[
          {
            arrayStride: 2 * 4 * 1,
            attributes:[{
              format:"float32x2" as GPUVertexFormat,
              offset: 0,
              shaderLocation: 0
            }
            ]
          }
        ]
      },
      fragment: {
        module: device.createShaderModule({
          code: edge_frag
        }),
        entryPoint: "main",
        targets:[{
          format:presentationFormat
        }]
      },
      primitive: {
        topology: "line-list" //triangle-list is default   
      },
      multisample: {
        count: 4
      }
    });

    this.rangeBuffer = this.device.createBuffer({
      size: 2 * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });

    this.nodePositionBuffer = device.createBuffer({
      size: 6 * 2 * 4,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true
    });
    new Float32Array(this.nodePositionBuffer.getMappedRange()).set([
      1, -1,
      -1, -1,
      -1, 1,
      1, -1,
      -1, 1,
      1, 1,
    ]);
    this.nodePositionBuffer.unmap();

    this.nodePipeline = device.createRenderPipeline({
      vertex: {
        module: device.createShaderModule({
          code: node_vert,
        }),
        entryPoint: 'main',
        buffers: [
          {
            arrayStride: 2 * 4,
            attributes: [
              {
                format: "float32x2" as GPUVertexFormat,
                offset: 0,
                shaderLocation: 0,
              }
            ],
          },
        ],
      },
      fragment: {
        module: device.createShaderModule({
          code: node_frag,
        }),
        entryPoint: 'main',
        targets: [
          {
            format: presentationFormat,
            blend: {
              color: {srcFactor: "one" as GPUBlendFactor, dstFactor: "one-minus-src-alpha" as GPUBlendFactor},
              alpha: {srcFactor: "one" as GPUBlendFactor, dstFactor: "one-minus-src-alpha" as GPUBlendFactor}
            },
          },
        ],
      },
      primitive: {
        topology: 'triangle-list',
      },
      multisample: {
        count: 4
      }
    });
  
    const pipeline = device.createRenderPipeline({
      vertex: {
        module: device.createShaderModule({
          code: display_2d_vert,
        }),
        entryPoint: 'main',
        buffers: [
          {
            arrayStride: 4 * 4,
            attributes: [
              {
                format: "float32x4" as GPUVertexFormat,
                offset: 0,
                shaderLocation: 0,
              }
            ],
          },
        ],
      },
      fragment: {
        module: device.createShaderModule({
          code: display_2d_frag,
        }),
        entryPoint: 'main',
        targets: [
          {
            format: presentationFormat,
          },
        ],
      },
      primitive: {
        topology: 'triangle-list',
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
      1, -1, 0, 1,  // position
      -1, -1, 0, 1, // position
      -1, 1, 0, 1,   // position
      1, -1, 0, 1,  // position
      -1, 1, 0, 1, // position
      1, 1, 0, 1,   // position
    ]);
    dataBuf2D.unmap();

    // Set up uniform buffers for bind group
    this.uniform2DBuffer = device.createBuffer({
      size: 2 * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(this.uniform2DBuffer, 0, new Float32Array([0.8, 0.2]), 0, 2);
    const imageSizeBuffer = device.createBuffer({
      size: 2 * 4,
      usage: GPUBufferUsage.UNIFORM,
      mappedAtCreation: true
    });
    new Uint32Array(imageSizeBuffer.getMappedRange()).set(this.canvasSize!);
    imageSizeBuffer.unmap();
    const nodeDataBuffer = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    // Load colormap texture
    const colorTexture = device.createTexture({
      size: [colormap.width, colormap.height, 1],
      format: "rgba8unorm",
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    });
    device.queue.copyExternalImageToTexture(
      { source: colormap },
      { texture: colorTexture },
      [colormap.width, colormap.height, 1]
    );

    this.terrainGenerator = new TerrainGenerator(device, this.canvasSize![0], this.canvasSize![1]);

    this.bindGroup2D = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: colorTexture.createView(),
        },
        {
          binding: 1,
          resource: {
            buffer: this.terrainGenerator.pixelValueBuffer,
          }
        },
        {
          binding: 2,
          resource: {
            buffer: this.uniform2DBuffer,
          },
        },
        {
          binding: 3,
          resource: {
            buffer: imageSizeBuffer,
          }
        }
      ],
    });
    // this.nodeBindGroup = device.createBindGroup({
    //   layout: pipeline.getBindGroupLayout(1),
    //   entries: [
    //     {
    //       binding: 0,
    //       resource: {
    //         buffer: nodeDataBuffer,
    //       }
    //     }
    //   ]
    // });
    var viewBoxBuffer = device.createBuffer({
      size: 4 * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(viewBoxBuffer, 0, new Float32Array([0, 0, 1, 1]), 0, 4);
    var translation = [0, 0, 1, 1];
    var newTranslation = [0, 0, 1, 1];
    var controller = new Controller();
    var terrainGenerator = this.terrainGenerator;
    var render = this;
    controller.mousemove = function (prev, cur, evt) {
      if (evt.buttons == 1) {
        var change = [(cur[0] - prev[0]) * (translation[2] - translation[0]) / render.canvasSize![0], (prev[1] - cur[1]) * (translation[3] - translation[1]) / render.canvasSize![1]];
        newTranslation = [newTranslation[0] - change[0], newTranslation[1] - change[1], newTranslation[2] - change[0], newTranslation[3] - change[1]]
        if (Math.abs(newTranslation[0] - translation[0]) > 0.03 * (translation[2] - translation[0]) || Math.abs(newTranslation[1] - translation[1]) > 0.03 * (translation[3] - translation[1])) {
          translation = newTranslation;
          if (render.terrainToggle) {
            terrainGenerator!.computeTerrain(undefined, undefined, translation, render.rangeBuffer);
          }
          if (render.nodeToggle) {
            device.queue.writeBuffer(viewBoxBuffer, 0, new Float32Array(translation), 0, 4);
          }
        }
      }
    };
    controller.wheel = function (amt) {
      var change = [amt / 10000, amt / 10000];
      newTranslation = [newTranslation[0] + change[0], newTranslation[1] + change[1], newTranslation[2] - change[0], newTranslation[3] - change[1]];
      if (newTranslation[2] - newTranslation[0] > 0.01 && newTranslation[3] - newTranslation[1] > 0.01) {
        translation = newTranslation;
        if (render.terrainToggle) {
          terrainGenerator!.computeTerrain(undefined, undefined, translation, render.rangeBuffer);
        }
        if (render.nodeToggle) {
          device.queue.writeBuffer(viewBoxBuffer, 0, new Float32Array(translation), 0, 4);
        }
      } else {
        newTranslation = translation;
      }
    };
    controller.registerForCanvas(canvasRef.current);
    var viewBoxBindGroup = device.createBindGroup({
      layout: this.nodePipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: {
            buffer: viewBoxBuffer,
          },
        },
      ],
    });

    const texture = device.createTexture({
      size: presentationSize,
      sampleCount: 4,
      format: presentationFormat,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    const view = texture.createView();

    var render = this;
    function frame() {
        // Sample is no longer the active page.
        if (!canvasRef.current) return;

        const commandEncoder = device.createCommandEncoder();

        const renderPassDescriptor: GPURenderPassDescriptor = {
        colorAttachments: [
          {
            view,
            resolveTarget: context.getCurrentTexture().createView(),
            loadValue: { r: 1.0, g: 1.0, b: 1.0, a: 1.0 },
            storeOp: "discard" as GPUStoreOp,
          },
        ],
        };

        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
        if (render.edgeToggle) {
          passEncoder.setPipeline(render.edgePipeline!);
          passEncoder.setVertexBuffer(0, render.edgeDataBuffer!);
          passEncoder.draw(render.edgeVertexCount);
        }
        if (render.terrainToggle) {
          passEncoder.setPipeline(pipeline);
          passEncoder.setVertexBuffer(0, dataBuf2D);
          passEncoder.setBindGroup(0, render.bindGroup2D!);
          passEncoder.draw(6, 1, 0, 0);
        }
        if (render.nodeToggle) {
          passEncoder.setPipeline(render.nodePipeline!);
          passEncoder.setVertexBuffer(0, render.nodePositionBuffer!);
          passEncoder.setBindGroup(0, viewBoxBindGroup);
          passEncoder.draw(render.nodeLength * 6, 1, 0, 0);
        }
        passEncoder.endPass();
  
        device.queue.submit([commandEncoder.finish()]);
        requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);

  }

  setNodeData(nodeData : Array<number>) {
    this.terrainGenerator!.computeTerrain(nodeData, undefined, undefined, this.rangeBuffer);
    var nodePositions : Array<number> = [];
    var radius : number = 0.01;
    for (var i = 0; i < nodeData.length; i+=4) {
      var x = nodeData[i+1] * 2 - 1;
      var y = nodeData[i+2] * 2 - 1;
      nodePositions.push(
        x + radius, y - radius,
        x - radius, y - radius,
        x - radius, y + radius,
        x + radius, y - radius,
        x - radius, y + radius,
        x + radius, y + radius
      );
    }
    this.nodePositionBuffer = this.device.createBuffer({
      size: nodePositions.length * 4,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true
    });
    new Float32Array(this.nodePositionBuffer.getMappedRange()).set(nodePositions);
    this.nodePositionBuffer.unmap();
    this.nodeLength = nodeData.length / 4;

    // this.nodeBindGroup = this.device.createBindGroup({
    //   layout: this.nodePipeline!.getBindGroupLayout(1),
    //   entries: [
    //     {
    //       binding: 0,
    //       resource: {
    //         buffer: this.terrainGenerator!.nodeDataBuffer,
    //       }
    //     }
    //   ]
    // });
  }

  setEdgeData(edgeData : Array<number>) {
    this.edgeDataBuffer = this.device.createBuffer({
      size: edgeData.length * 4,
      usage: GPUBufferUsage.COPY_SRC | GPUBufferUsage.VERTEX,
      mappedAtCreation: true
    });
    new Float32Array(this.edgeDataBuffer.getMappedRange()).set(edgeData);
    this.edgeDataBuffer.unmap();
    this.edgeVertexCount = edgeData.length / 2;
  }

  setWidthFactor(widthFactor : number) {
    this.terrainGenerator!.computeTerrain(undefined, widthFactor, undefined, this.rangeBuffer);
  }

  setPeakValue(value : number) {
    this.device.queue.writeBuffer(this.uniform2DBuffer!, 0, new Float32Array([value]), 0, 1);
  }

  setValleyValue(value : number) {
    this.device.queue.writeBuffer(this.uniform2DBuffer!, 4, new Float32Array([value]), 0, 1);
  }

  setGlobalRange() {
    if (this.rangeBuffer) {
      this.rangeBuffer = null;
    } else {
      this.rangeBuffer = this.device.createBuffer({
        size: 2 * 4,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
      });    
    }
  }

  toggleTerrainLayer() {
    this.terrainToggle = !this.terrainToggle;
  }

  toggleNodeLayer() {
    this.nodeToggle = !this.nodeToggle;
  }

  toggleEdgeLayer() {
    this.edgeToggle = !this.edgeToggle;
  }

  async onSave() {
    var height = this.outCanvasRef.current!.height;
    var width = this.outCanvasRef.current!.width;
    const gpuReadBuffer = this.device.createBuffer({
      size: width * height * 4,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });
    console.log(width, height);
    var commandEncoder = this.device.createCommandEncoder();
    // Encode commands for copying buffer to buffer.
    commandEncoder.copyBufferToBuffer(
      this.terrainGenerator!.pixelValueBuffer /* source buffer */,
      0 /* source offset */,
      gpuReadBuffer /* destination buffer */,
      0 /* destination offset */,
      width * height * 4 /* size */
    );

    // Submit GPU commands.
    const gpuCommands = commandEncoder.finish();
    this.device.queue.submit([gpuCommands]);

    // Read buffer.
    await gpuReadBuffer.mapAsync(GPUMapMode.READ);
    const arrayBuffer = gpuReadBuffer.getMappedRange();
    var output = new Float32Array(arrayBuffer);
    var context = this.outCanvasRef.current!.getContext('2d');
    context!.drawImage(this.colormapImage, 0, 0);
    var colorData = context!.getImageData(0, 0, 180, 1).data;
    var imgData = context!.createImageData(width, height);
    for (var i = 0; i < height; i++) {
      for (var j = 0; j < width; j++) {
        var index = j + i * width;
        var colorIndex = Math.trunc(output[j + (height - 1 - i) * width] * 180) * 4;
        imgData.data[index * 4] = colorData[colorIndex];
        imgData.data[index * 4 + 1] = colorData[colorIndex + 1];
        imgData.data[index * 4 + 2] = colorData[colorIndex + 2];
        imgData.data[index * 4 + 3] = colorData[colorIndex + 3];
      }
    }
    context!.putImageData(imgData, 0, 0);
    this.outCanvasRef.current!.toBlob(function (b) { saveAs(b!, `terrain.png`); }, "image/png");
  }

}
export default Renderer;

