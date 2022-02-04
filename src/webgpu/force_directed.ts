import { buffer } from 'd3';
import {
    apply_forces,
    create_adjacency_matrix,
    compute_forces
} from './wgsl';

class ForceDirected {
    public paramsBuffer: GPUBuffer;
    public nodeDataBuffer: GPUBuffer;
    public edgeDataBuffer: GPUBuffer;
    public adjMatrixBuffer: GPUBuffer;
    public laplacianBuffer: GPUBuffer;
    public forceDataBuffer: GPUBuffer;
    public coolingFactor: number = 0.9;
    public device: GPUDevice;
    public createMatrixPipeline : GPUComputePipeline;
    public computeForcesPipeline: GPUComputePipeline;
    public applyForcesPipeline: GPUComputePipeline;
    public iterationCount: number = 10000;
    public threshold: number = 100;
    public force: number = 1000.0;

    constructor(device: GPUDevice) {
        this.device = device;

        this.nodeDataBuffer = this.device.createBuffer({
            size: 16,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
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
                    code: create_adjacency_matrix
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
    }

    async runForces(
        nodeDataBuffer = this.nodeDataBuffer, 
        edgeDataBuffer = this.edgeDataBuffer, 
        nodeLength: number = 0, edgeLength: number = 0, 
        coolingFactor = this.coolingFactor, l = 0.05, 
        iterationCount = this.iterationCount, 
        threshold = this.threshold,
        iterRef
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
        this.adjMatrixBuffer = this.device.createBuffer({
            size: nodeLength * nodeLength * 4,
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
                    }
                },
                {
                    binding: 1,
                    resource: {
                        buffer: this.adjMatrixBuffer,
                    }
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
                        buffer: this.laplacianBuffer
                    }
                }
            ]
        });

        var pass = commandEncoder.beginComputePass();
        pass.setBindGroup(0, createBindGroup);
        pass.setPipeline(this.createMatrixPipeline);
        pass.dispatch(1, 1, 1);      
        pass.endPass();
        // Log adjacency matrix
        const gpuReadBuffer = this.device.createBuffer({
            size: nodeLength * nodeLength * 4,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
        });
        // Encode commands for copying buffer to buffer.
        commandEncoder.copyBufferToBuffer(
            this.laplacianBuffer /* source buffer */ ,
            0 /* source offset */ ,
            gpuReadBuffer /* destination buffer */ ,
            0 /* destination offset */ ,
            nodeLength * nodeLength * 4 /* size */
        );
        this.device.queue.submit([commandEncoder.finish()]);
        
        // Log adjacency matrix (count should be equal to the number of nonduplicate edges)
        await gpuReadBuffer.mapAsync(GPUMapMode.READ);
        const arrayBuffer = gpuReadBuffer.getMappedRange();
        var output = new Int32Array(arrayBuffer);
        var count = 0;
        for (var i = 0; i < output.length; i++) {
            count+=output[i];
        }
        console.log(output);
        console.log(count);
        console.log(output.length);

        this.forceDataBuffer = this.device.createBuffer({
            size: nodeLength * 2 * 4,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
        });

        var iterationTimes : Array<number> = [];
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
                    }
                }
            ],
        });
        while (iterationCount > 0 && this.coolingFactor > 0.000001 && this.force >= 0) {

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
                        }
                    },
                    {
                        binding: 3,
                        resource: {
                            buffer: this.paramsBuffer,
                        },
                    }
                    
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

            this.device.queue.submit([commandEncoder.finish()]);
            var start : number = performance.now();
            await this.device.queue.onSubmittedWorkDone();
            var end : number = performance.now();
            console.log(`iteration time ${end - start}`)
            iterationTimes.push(end - start);

            // this.maxForceResultBuffer.unmap();
            // Read all of the forces applied.
            // await gpuReadBuffer.mapAsync(GPUMapMode.READ);
            // const arrayBuffer = gpuReadBuffer.getMappedRange();
            // var output = new Float32Array(arrayBuffer);
            // console.log(output);
            this.coolingFactor = this.coolingFactor * coolingFactor;
            
        }
        var totalEnd = performance.now();
        var iterAvg : number = iterationTimes.reduce(function(a, b) {return a + b}) / iterationTimes.length;
        iterRef.current!.innerText = `Completed in ${iterationTimes.length} iterations with total time ${totalEnd - totalStart} and average iteration time ${iterAvg}`;
    }
}

export default ForceDirected;