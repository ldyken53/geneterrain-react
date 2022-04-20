import { buffer } from 'd3';
import {
    apply_forces,
    create_adjacency_matrix,
    compute_forces,
    create_quadtree
} from './wgsl';

import { greadability } from "../greadibility.js";

class ForceDirected {
  public paramsBuffer: GPUBuffer;
  public nodeDataBuffer: GPUBuffer;
  public edgeDataBuffer: GPUBuffer;
  public adjMatrixBuffer: GPUBuffer;
  public laplacianBuffer: GPUBuffer;
  public forceDataBuffer: GPUBuffer;
  public coolingFactor: number = 0.9;
  public device: GPUDevice;
  public createMatrixPipeline: GPUComputePipeline;
  public createQuadTreePipeline: GPUComputePipeline;
  public computeForcesPipeline: GPUComputePipeline;
  public applyForcesPipeline: GPUComputePipeline;
  public iterationCount: number = 10000;
  public threshold: number = 100;
  public force: number = 1000.0;
  public positionReadBuffer: any;

  constructor(device: GPUDevice) {
    this.device = device;

    this.nodeDataBuffer = this.device.createBuffer({
      size: 16,
      usage:
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.COPY_DST |
        GPUBufferUsage.COPY_SRC,
    });

    this.edgeDataBuffer = this.device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    this.adjMatrixBuffer = this.device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    this.laplacianBuffer = this.device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    this.forceDataBuffer = this.device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });

    this.createMatrixPipeline = device.createComputePipeline({
      compute: {
        module: device.createShaderModule({
          code: create_adjacency_matrix,
        }),
        entryPoint: "main",
      },
    });

    this.createQuadTreePipeline = device.createComputePipeline({
      compute: {
        module: device.createShaderModule({
          code: create_quadtree,
        }),
        entryPoint: "main",
      },
    });

    this.computeForcesPipeline = device.createComputePipeline({
      compute: {
        module: device.createShaderModule({
          code: compute_forces,
        }),
        entryPoint: "main",
      },
    });

    this.applyForcesPipeline = device.createComputePipeline({
      compute: {
        module: device.createShaderModule({
          code: apply_forces,
        }),
        entryPoint: "main",
      },
    });

    // Create a buffer to store the params, output, and min/max
    this.paramsBuffer = device.createBuffer({
      size: 4 * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.positionReadBuffer = null;
  }

  formatToD3Format(positionList, edgeList, nLength, eLength) {
    let nodeLength = positionList.length;
    let nodeArray1 = new Array(nLength);
    let edgeArray1 = new Array(eLength);

    for (let i = 0; i < 4 * nodeLength; i = i + 4) {
      nodeArray1[i / 4] = {};
      nodeArray1[i / 4].index = i / 4;
      nodeArray1[i / 4].name = (i / 4).toString();
      nodeArray1[i / 4].x = positionList[i + 1];
      nodeArray1[i / 4].y = positionList[i + 2];
    }

    for (let i = 0; i < eLength; i = i + 2) {
      edgeArray1[i / 2] = {};
      let sourceIndex = edgeList[i];
      let targetIndex = edgeList[i + 1];

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
      edgeArray: edgeArray1,
    };
  }

  async runForces(
    nodeDataBuffer = this.nodeDataBuffer,
    edgeDataBuffer = this.edgeDataBuffer,
    nodeLength: number = 0,
    edgeLength: number = 0,
    coolingFactor = this.coolingFactor,
    l = 0.05,
    iterationCount = this.iterationCount,
    threshold = this.threshold,
    iterRef,
    edgeList
  ) {
    if (nodeLength == 0 || edgeLength == 0) {
      return;
    }
    console.log(l);
    console.log(coolingFactor);
    this.coolingFactor = coolingFactor;
    this.nodeDataBuffer = nodeDataBuffer;
    this.edgeDataBuffer = edgeDataBuffer;
    this.threshold = threshold;
    this.force = 100000;

    // Set up params (node length, edge length) for creating adjacency matrix
    var upload = this.device.createBuffer({
      size: 4 * 4,
      usage: GPUBufferUsage.COPY_SRC,
      mappedAtCreation: true,
    });
    var mapping = upload.getMappedRange();
    new Uint32Array(mapping).set([nodeLength, edgeLength]);
    new Float32Array(mapping).set([this.coolingFactor, l], 2);
    upload.unmap();
    let adjMatrixSize = Math.ceil((nodeLength * nodeLength * 4) / 32);
    this.adjMatrixBuffer = this.device.createBuffer({
      size: adjMatrixSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });
    this.laplacianBuffer = this.device.createBuffer({
      size: nodeLength * nodeLength * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });
    var commandEncoder = this.device.createCommandEncoder();
    commandEncoder.copyBufferToBuffer(upload, 0, this.paramsBuffer, 0, 4 * 4);
    var createBindGroup = this.device.createBindGroup({
      layout: this.createMatrixPipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: {
            buffer: this.edgeDataBuffer,
          },
        },
        {
          binding: 1,
          resource: {
            buffer: this.adjMatrixBuffer,
          },
        },
        {
          binding: 2,
          resource: {
            buffer: this.paramsBuffer,
          },
        },
        {
          binding: 3,
          resource: {
            buffer: this.laplacianBuffer,
          },
        },
      ],
    });

    var pass = commandEncoder.beginComputePass();
    pass.setBindGroup(0, createBindGroup);
    pass.setPipeline(this.createMatrixPipeline);
    pass.dispatch(1, 1, 1);
    pass.endPass();
    // Log adjacency matrix
    const gpuReadBuffer = this.device.createBuffer({
      size: nodeLength * nodeLength * 4,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });
    // Encode commands for copying buffer to buffer.
    commandEncoder.copyBufferToBuffer(
      this.adjMatrixBuffer /* source buffer */,
      0 /* source offset */,
      gpuReadBuffer /* destination buffer */,
      0 /* destination offset */,
      adjMatrixSize /* size */
    );
    this.device.queue.submit([commandEncoder.finish()]);

    // Log adjacency matrix (count should be equal to the number of nonduplicate edges)
    await gpuReadBuffer.mapAsync(GPUMapMode.READ);
    const arrayBuffer = gpuReadBuffer.getMappedRange();
    var output = new Int32Array(arrayBuffer);
    var count = 0;
    // for (var i = 0; i < output.length; i++) {
    //     count+=output[i];
    // }
    console.log(output);
    console.log(count);
    console.log(output.length);

    this.forceDataBuffer = this.device.createBuffer({
      size: nodeLength * 2 * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });

    var iterationTimes: Array<number> = [];
    var totalStart = performance.now();
    var applyBindGroup = this.device.createBindGroup({
      layout: this.applyForcesPipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: {
            buffer: this.nodeDataBuffer,
          },
        },
        {
          binding: 1,
          resource: {
            buffer: this.forceDataBuffer,
          },
        },
      ],
    });
    while (
      iterationCount > 0 &&
      this.coolingFactor > 0.0001 &&
      this.force >= 0
    ) {
      iterationCount--;
      // Set up params (node length, edge length)
      var upload = this.device.createBuffer({
        size: 4 * 4,
        usage: GPUBufferUsage.COPY_SRC,
        mappedAtCreation: true,
      });
      var mapping = upload.getMappedRange();
      new Uint32Array(mapping).set([nodeLength, edgeLength]);
      new Float32Array(mapping).set([this.coolingFactor, l], 2);
      upload.unmap();
      //this.device.createQuerySet({})
      var commandEncoder = this.device.createCommandEncoder();
      //commandEncoder.writeTimestamp();
      commandEncoder.copyBufferToBuffer(upload, 0, this.paramsBuffer, 0, 4 * 4);
      // Create bind group
      var bindGroup = this.device.createBindGroup({
        layout: this.computeForcesPipeline.getBindGroupLayout(0),
        entries: [
          {
            binding: 0,
            resource: {
              buffer: this.nodeDataBuffer,
            },
          },
          {
            binding: 1,
            resource: {
              buffer: this.adjMatrixBuffer,
            },
          },
          {
            binding: 2,
            resource: {
              buffer: this.forceDataBuffer,
            },
          },
          {
            binding: 3,
            resource: {
              buffer: this.paramsBuffer,
            },
          },
        ],
      });

      // Run attract forces pass
      // var pass = commandEncoder.beginComputePass();
      // pass.setBindGroup(0, attractBindGroup);
      // pass.setPipeline(this.computeAttractForcesPipeline);
      // pass.dispatch(1, 1, 1);
      // pass.endPass();
      // this.device.queue.submit([commandEncoder.finish()]);
      // var start : number = performance.now();
      // await this.device.queue.onSubmittedWorkDone();
      // var end : number = performance.now();
      // console.log(`attract force time: ${end - start}`)
      // var commandEncoder = this.device.createCommandEncoder();

      // Run compute forces pass
      var pass = commandEncoder.beginComputePass();
      pass.setBindGroup(0, bindGroup);
      pass.setPipeline(this.computeForcesPipeline);
      pass.dispatch(nodeLength, 1, 1);
      pass.endPass();

      // Testing timing of both passes (comment out when not debugging)
      // pass.endPass();
      // this.device.queue.submit([commandEncoder.finish()]);
      // var start : number = performance.now();
      // await this.device.queue.onSubmittedWorkDone();
      // var end : number = performance.now();
      // console.log(`compute force time: ${end - start}`)
      // var commandEncoder = this.device.createCommandEncoder();

      // const gpuReadBuffer = this.device.createBuffer({
      //     size: nodeLength * 2 * 4,
      //     usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
      // });
      // // Encode commands for copying buffer to buffer.
      // commandEncoder.copyBufferToBuffer(
      //     this.forceDataBuffer /* source buffer */ ,
      //     0 /* source offset */ ,
      //     gpuReadBuffer /* destination buffer */ ,
      //     0 /* destination offset */ ,
      //     nodeLength * 2 * 4 /* size */
      // );
      var pass = commandEncoder.beginComputePass();

      //commandEncoder.writeTimestamp();

      // Run apply forces pass
      pass.setBindGroup(0, applyBindGroup);
      pass.setPipeline(this.applyForcesPipeline);
      pass.dispatch(nodeLength, 1, 1);
      pass.endPass();

      this.positionReadBuffer = this.device.createBuffer({
        size: nodeLength * 4 * 4,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
      });

      commandEncoder.copyBufferToBuffer(
        this.nodeDataBuffer,
        0,
        this.positionReadBuffer,
        0,
        nodeLength * 4 * 4
      );

      await this.device.queue.submit([commandEncoder.finish()]);

      var start: number = performance.now();
      await this.device.queue.onSubmittedWorkDone();
      var end: number = performance.now();
      console.log(`iteration time ${end - start}`);
      iterationTimes.push(end - start);

      // this.maxForceResultBuffer.unmap();
      // Read all of the forces applied.
      // await gpuReadBuffer.mapAsync(GPUMapMode.READ);
      // const arrayBuffer = gpuReadBuffer.getMappedRange();
      // var output = new Float32Array(arrayBuffer);
      // console.log(output);
      this.coolingFactor = this.coolingFactor * coolingFactor;
    }

    await this.positionReadBuffer.mapAsync(GPUMapMode.READ);
    let positionArrayBuffer = this.positionReadBuffer.getMappedRange();
    let positionList = new Float32Array(positionArrayBuffer);

    let d3Format = this.formatToD3Format(
      positionList,
      edgeList,
      nodeLength,
      edgeLength
    );
    let formattednodeList = d3Format.nodeArray;
    let formattedEdgeList = d3Format.edgeArray;

    console.log(formattednodeList, formattedEdgeList);
    // console.log(greadability(formattednodeList, formattedEdgeList));

    var totalEnd = performance.now();
    var iterAvg: number =
      iterationTimes.reduce(function (a, b) {
        return a + b;
      }) / iterationTimes.length;
    iterRef.current!.innerText = `Completed in ${
      iterationTimes.length
    } iterations with total time ${
      totalEnd - totalStart
    } and average iteration time ${iterAvg}`;
  }
}

export default ForceDirected;