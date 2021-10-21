import { makeSample, SampleInit } from './components/SampleLayout';
import TerrainGenerator from './terrain_generator';
import { triangle_vert, triangle_frag } from './wgsl';

const init: SampleInit = async ({ canvasRef, nodeData }) => {
  const adapter = (await navigator.gpu.requestAdapter())!;
  const device = await adapter.requestDevice();


  if (canvasRef.current === null) return;
  const context = canvasRef.current.getContext('webgpu')!;

  const devicePixelRatio = window.devicePixelRatio || 1;
  const presentationSize = [
    canvasRef.current.clientWidth * devicePixelRatio,
    canvasRef.current.clientHeight * devicePixelRatio,
  ];
  const presentationFormat = context.getPreferredFormat(adapter);

  var terrainGenerator : TerrainGenerator = new TerrainGenerator(device, canvasRef.current.clientWidth, canvasRef.current.clientHeight);
  if (nodeData.length > 0) {
    terrainGenerator.computeTerrain(nodeData, 1000, [0, 0, 1, 1], null);
  }

  context.configure({
    device,
    format: presentationFormat,
    size: presentationSize,
  });

  const pipeline = device.createRenderPipeline({
    vertex: {
      module: device.createShaderModule({
        code: triangle_vert,
      }),
      entryPoint: 'main',
    },
    fragment: {
      module: device.createShaderModule({
        code: triangle_frag,
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
  });

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
          storeOp: 'store' as GPUStoreOp,
        },
      ],
    };

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(pipeline);
    passEncoder.draw(3, 1, 0, 0);
    passEncoder.endPass();

    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
};

const WebGPU: (nodeData) => JSX.Element = (nodeData) => {
  return makeSample({
    init,
    nodeData
  });
}
export default WebGPU;