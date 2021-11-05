import { Controller } from './ez_canvas_controller';
import TerrainGenerator from './terrain_generator';
import { display_2d_vert, display_2d_frag, node_vert, node_frag } from './wgsl';

class Renderer {
  public uniform2DBuffer : GPUBuffer | null = null;
  public terrainGenerator : TerrainGenerator | null = null;
  public device : GPUDevice;
  public bindGroup2D : GPUBindGroup | null = null;
  public nodeBindGroup : GPUBindGroup | null = null;
  public nodePositionBuffer : GPUBuffer | null = null;
  public nodePipeline : GPURenderPipeline | null = null;
  public nodeLength : number = 1;

  constructor(adapter : GPUAdapter, device : GPUDevice, canvasRef : React.RefObject<HTMLCanvasElement>, colormap : ImageBitmap) {
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
  
    context.configure({
      device,
      format: presentationFormat,
      size: presentationSize,
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
          },
        ],
      },
      primitive: {
        topology: 'triangle-list',
      },
      depthStencil: {
        format: "depth24plus-stencil8",
        depthWriteEnabled: true,
        depthCompare: "less",
      },
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
      depthStencil: {
        format: "depth24plus-stencil8",
        depthWriteEnabled: true,
        depthCompare: "less",
      },
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
    new Uint32Array(imageSizeBuffer.getMappedRange()).set(presentationSize);
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

    // Create depth texture
    var depthTexture = device.createTexture({
      size: {
        width: presentationSize[0],
        height: presentationSize[1],
        depthOrArrayLayers: 1,
      },
      format: "depth24plus-stencil8",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    this.terrainGenerator = new TerrainGenerator(device, presentationSize[0], presentationSize[1]);

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
    controller.mousemove = function (prev, cur, evt) {
      if (evt.buttons == 1) {
        var change = [(cur[0] - prev[0]) / presentationSize[0], (prev[1] - cur[1]) / presentationSize[1]];
        newTranslation = [newTranslation[0] - change[0], newTranslation[1] - change[1], newTranslation[2] - change[0], newTranslation[3] - change[1]]
        if (Math.abs(newTranslation[0] - translation[0]) > 0.03 || Math.abs(newTranslation[1] - translation[1]) > 0.03) {
          translation = newTranslation;
          terrainGenerator!.computeTerrain(undefined, undefined, translation);
          console.log(translation);
          device.queue.writeBuffer(viewBoxBuffer, 0, new Float32Array(translation), 0, 4);
        }
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

    var render = this;
    function frame() {
        // Sample is no longer the active page.
        if (!canvasRef.current) return;

        const commandEncoder = device.createCommandEncoder();
        const textureView = context.getCurrentTexture().createView();

        const renderPassDescriptor: GPURenderPassDescriptor = {
        colorAttachments: [
          {
            view: textureView,
            loadValue: { r: 0.157, g: 0.173, b: 0.204, a: 1.0 },
            storeOp: "store" as GPUStoreOp,
          },
        ],
        depthStencilAttachment: {
          view: depthTexture.createView(),
          depthLoadValue: 1.0,
          depthStoreOp: "store",
          stencilLoadValue: 0,
          stencilStoreOp: "store",
        },
        };

        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
        passEncoder.setPipeline(render.nodePipeline!);
        passEncoder.setVertexBuffer(0, render.nodePositionBuffer!);
        passEncoder.setBindGroup(0, viewBoxBindGroup);
        passEncoder.draw(render.nodeLength * 6, 1, 0, 0);
        passEncoder.setPipeline(pipeline);
        passEncoder.setVertexBuffer(0, dataBuf2D);
        passEncoder.setBindGroup(0, render.bindGroup2D!);
        passEncoder.draw(6, 1, 0, 0);
        passEncoder.endPass();
  
        device.queue.submit([commandEncoder.finish()]);
        requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);

  }

  setNodeData(nodeData : Array<number>) {
    // TODO: Implement the translation and global range options
    this.terrainGenerator!.computeTerrain(nodeData);
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

  setWidthFactor(widthFactor : number) {
    this.terrainGenerator!.computeTerrain(undefined, widthFactor);
  }

  setPeakValue(value : number) {
    this.device.queue.writeBuffer(this.uniform2DBuffer!, 0, new Float32Array([value]), 0, 1);
  }

  setValleyValue(value : number) {
    this.device.queue.writeBuffer(this.uniform2DBuffer!, 4, new Float32Array([value]), 0, 1);
  }
}
export default Renderer;

