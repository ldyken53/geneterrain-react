import {
    compute_forces,
    apply_forces
} from './wgsl';

class ForceDirected {
    public paramsBuffer: GPUBuffer;
    public nodeDataBuffer: GPUBuffer;
    public edgeDataBuffer: GPUBuffer;
    public forceDataBuffer: GPUBuffer;
    public maxForceBuffer: GPUBuffer;
    public maxForceResultBuffer: GPUBuffer;
    public forceStageBuffer: GPUBuffer;
    public coolingFactor: number = 0.9;
    public device: GPUDevice;
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

        this.forceDataBuffer = this.device.createBuffer({
            size: 16,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
        });

        this.maxForceBuffer = this.device.createBuffer({
            size:4,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true
        });

        new Int32Array(this.maxForceBuffer.getMappedRange()).set([0]);
        this.maxForceBuffer.unmap();
        
        this.maxForceResultBuffer = this.device.createBuffer({
                size: 4,
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
            });


        this.forceStageBuffer = this.device.createBuffer({
            size:4,
            usage: GPUBufferUsage.MAP_WRITE | GPUBufferUsage.COPY_SRC,
            mappedAtCreation:true
        })

        new Int32Array(this.forceStageBuffer.getMappedRange()).set([0]);
        this.forceStageBuffer.unmap();

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
        console.log(edgeLength);
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
                entries: [{
                        binding: 0,
                        resource: {
                            buffer: this.nodeDataBuffer,
                        },
                    },
                    {
                        binding: 1,
                        resource: {
                            buffer: this.edgeDataBuffer,
                        }
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
                    },
                    // {
                    //     binding:4,
                    //     resource: {
                    //         buffer: this.maxForceBuffer
                    //     }
                    // }
                    
                ],
            });

            // Run compute forces pass
            var pass = commandEncoder.beginComputePass();
            pass.setBindGroup(0, bindGroup);
            pass.setPipeline(this.computeForcesPipeline);
            pass.dispatch(nodeLength, 1, 1);

            // Testing timing of both passes (comment out when not debugging)
            pass.endPass();
            this.device.queue.submit([commandEncoder.finish()]);
            var start : number = performance.now();
            await this.device.queue.onSubmittedWorkDone();
            var end : number = performance.now();
            console.log(`compute force time: ${end - start}`)
            var commandEncoder = this.device.createCommandEncoder();
            var pass = commandEncoder.beginComputePass();

            //commandEncoder.writeTimestamp();

            // Run apply forces pass
            pass.setBindGroup(0, applyBindGroup);
            pass.setPipeline(this.applyForcesPipeline);
            pass.dispatch(nodeLength, 1, 1);
            pass.endPass();
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
            
            // commandEncoder.copyBufferToBuffer(this.maxForceBuffer, 0, this.maxForceResultBuffer, 0, 4);
            // commandEncoder.copyBufferToBuffer(this.forceStageBuffer, 0, this.maxForceBuffer, 0, 4);

            this.device.queue.submit([commandEncoder.finish()]);
            var start : number = performance.now();
            await this.device.queue.onSubmittedWorkDone();
            var end : number = performance.now();
            console.log(`apply time ${end - start}`)
            iterationTimes.push(end - start);

            // await this.maxForceResultBuffer.mapAsync(GPUMapMode.READ);
            // const maxForceArrayBuffer = this.maxForceResultBuffer.getMappedRange();
            // let maxForce = new Int32Array(maxForceArrayBuffer);
            // this.force = maxForce[0];           
            // console.log(this.force);
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