<<<<<<< HEAD
import {
    compute_forces,
    apply_forces
=======
import { buffer } from 'd3';
import {
    compute_forces,
    apply_forces,
    compute_forces_a
>>>>>>> 50be5a5424db75fe85809ac81c1eeaedc9983d87
} from './wgsl';

class ForceDirected {
    public paramsBuffer: GPUBuffer;
    public nodeDataBuffer: GPUBuffer;
    public edgeDataBuffer: GPUBuffer;
    public forceDataBuffer: GPUBuffer;
<<<<<<< HEAD
    public coolingFactor: number = 0.99;
    public device: GPUDevice;
    public computeForcesPipeline: GPUComputePipeline;
    public applyForcesPipeline: GPUComputePipeline;
    public iterationCount: number = 1000;
=======
    public maxForceBuffer: GPUBuffer;
    public maxForceResultBuffer: GPUBuffer;
    public forceStageBuffer: GPUBuffer;
    public coolingFactor: number = 0.9;
    public device: GPUDevice;
    public computeForcesPipeline: GPUComputePipeline;
    public computeAttractForcesPipeline: GPUComputePipeline;
    public applyForcesPipeline: GPUComputePipeline;
    public iterationCount: number = 10000;
    public threshold: number = 100;
    public force: number = 1000.0;
>>>>>>> 50be5a5424db75fe85809ac81c1eeaedc9983d87

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

        this.computeAttractForcesPipeline = device.createComputePipeline({
            compute: {
                module: device.createShaderModule({
                    code: compute_forces_a,
                }),
                entryPoint: "main",
            },
            layout: device.createPipelineLayout({
                bindGroupLayouts: [
                    device.createBindGroupLayout({
                        entries: [
                            {
                                binding: 0,
                                visibility: GPUShaderStage.COMPUTE,
                                buffer: {
                                    type: "read-only-storage" as GPUBufferBindingType
                                }
                            },
                            {
                                binding: 1,
                                visibility: GPUShaderStage.COMPUTE,
                                buffer: {
                                    type: "read-only-storage" as GPUBufferBindingType
                                }
                            },
                            {
                                binding: 2,
                                visibility: GPUShaderStage.COMPUTE,
                                buffer: {
                                    type: "storage" as GPUBufferBindingType
                                }
                            },
                            {
                                binding: 3,
                                visibility: GPUShaderStage.COMPUTE,
                                buffer: {
                                    type: "uniform" as GPUBufferBindingType
                                }
                            }, 
                        ]
                    })
                ]
            }),
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

<<<<<<< HEAD
    async runForces(nodeDataBuffer = this.nodeDataBuffer, edgeDataBuffer = this.edgeDataBuffer, nodeLength: number = 0, edgeLength: number = 0, coolingFactor = this.coolingFactor, l = 0.1, iterationCount = this.iterationCount) {
        if (nodeLength == 0 || edgeLength == 0) {
            return;
        }

        console.log(this.paramsBuffer);
=======
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
>>>>>>> 50be5a5424db75fe85809ac81c1eeaedc9983d87
        this.coolingFactor = coolingFactor;
        this.nodeDataBuffer = nodeDataBuffer;
        this.edgeDataBuffer = edgeDataBuffer;
        this.threshold = threshold;
        this.force = 100000;

        this.forceDataBuffer = this.device.createBuffer({
            size: nodeLength * 2 * 4,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
        });
<<<<<<< HEAD
        while (iterationCount > 0 && this.coolingFactor > 0.000001) {
            // Set up params (node length, edge length)
            iterationCount--;
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
=======

        var iterationTimes : Array<number> = [];
        var totalStart = performance.now();
        var applyBindGroup = this.device.createBindGroup({
            layout: this.applyForcesPipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.nodeDataBuffer,
>>>>>>> 50be5a5424db75fe85809ac81c1eeaedc9983d87
                    },
                    {
                        binding: 3,
                        resource: {
                            buffer: this.paramsBuffer,
                        },
                    }
<<<<<<< HEAD
                ],
            });

            // Run compute forces pass
            var pass = commandEncoder.beginComputePass();
            pass.setBindGroup(0, bindGroup);
            pass.setPipeline(this.computeForcesPipeline);
            pass.dispatch(nodeLength, 1, 1);
            //commandEncoder.writeTimestamp();
            // await this.device.queue.onSubmittedWorkDone();

            // Look into submitting normalization and compute in one pass to improve speed, remove synchronizations
            // Use writetimestamp for more accurate kernel timing

            // Run apply forces pass
            var bindGroup = this.device.createBindGroup({
                layout: this.applyForcesPipeline.getBindGroupLayout(0),
=======
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
>>>>>>> 50be5a5424db75fe85809ac81c1eeaedc9983d87
                entries: [{
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
<<<<<<< HEAD
                    }
                ],
            });
            pass.setBindGroup(0, bindGroup);
=======
                    },
                    {
                        binding: 2,
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
            var attractBindGroup = this.device.createBindGroup({
                layout: this.computeAttractForcesPipeline.getBindGroupLayout(0),
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

            // Run attract forces pass
            var pass = commandEncoder.beginComputePass();
            pass.setBindGroup(0, attractBindGroup);
            pass.setPipeline(this.computeAttractForcesPipeline);
            pass.dispatch(1, 1, 1);      
            pass.endPass();
            this.device.queue.submit([commandEncoder.finish()]);
            // var start : number = performance.now();
            // await this.device.queue.onSubmittedWorkDone();
            // var end : number = performance.now();
            // console.log(`attract force time: ${end - start}`)
            var commandEncoder = this.device.createCommandEncoder();

            // Run compute forces pass
            var pass = commandEncoder.beginComputePass();
            pass.setBindGroup(0, bindGroup);
            pass.setPipeline(this.computeForcesPipeline);
            pass.dispatch(nodeLength, 1, 1);

            // Testing timing of both passes (comment out when not debugging)
            pass.endPass();
            this.device.queue.submit([commandEncoder.finish()]);
            // var start : number = performance.now();
            // await this.device.queue.onSubmittedWorkDone();
            // var end : number = performance.now();
            // console.log(`compute force time: ${end - start}`)
            var commandEncoder = this.device.createCommandEncoder();

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
>>>>>>> 50be5a5424db75fe85809ac81c1eeaedc9983d87
            pass.setPipeline(this.applyForcesPipeline);
            pass.dispatch(nodeLength, 1, 1);
            pass.endPass();

<<<<<<< HEAD
            // //node position result
            // const gpuNodePositionBuffer = this.device.createBuffer({
            //     size:nodeLength*4,
            //     usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
            //     mappedAtCreation: false
            // });

            // commandEncoder.copyBufferToBuffer(this.nodeDataBuffer, 0, gpuNodePositionBuffer, 0, nodeLength*4);

            //displacement result
            const gpuReadBuffer = this.device.createBuffer({
                size: nodeLength * 2 * 4,
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
            });
            // Encode commands for copying buffer to buffer.
            commandEncoder.copyBufferToBuffer(
                this.forceDataBuffer /* source buffer */ ,
                0 /* source offset */ ,
                gpuReadBuffer /* destination buffer */ ,
                0 /* destination offset */ ,
                nodeLength * 2 * 4 /* size */
            );

            this.device.queue.submit([commandEncoder.finish()]);
            // await this.device.queue.onSubmittedWorkDone();

            //Read Node after these command batched are executed

            // await gpuNodePositionBuffer.mapAsync(GPUMapMode.READ);
            // const positionArrayBuffer = gpuNodePositionBuffer.getMappedRange();
            // let updatedNodePosition = new Float32Array(positionArrayBuffer);

            // for(let m=0, length1 = updatedNodePosition.length; m<length1; m = m+2){
            //     console.log(`iteration ${i} node ${m} has position ( ${updatedNodePosition[m]}, ${updatedNodePosition[m+1]}) \n`);
            // }

            // Read buffer.
            await gpuReadBuffer.mapAsync(GPUMapMode.READ);
            const arrayBuffer = gpuReadBuffer.getMappedRange();
            var output = new Float32Array(arrayBuffer);
            console.log(output);
            this.coolingFactor = this.coolingFactor * coolingFactor;
            if (this.coolingFactor < 0.00001) {
                break;
            }
            // console.log(this.coolingFactor);
=======
            
            // commandEncoder.copyBufferToBuffer(this.maxForceBuffer, 0, this.maxForceResultBuffer, 0, 4);
            // commandEncoder.copyBufferToBuffer(this.forceStageBuffer, 0, this.maxForceBuffer, 0, 4);

            this.device.queue.submit([commandEncoder.finish()]);
            var start : number = performance.now();
            await this.device.queue.onSubmittedWorkDone();
            var end : number = performance.now();
            console.log(`iteration time ${end - start}`)
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
            
>>>>>>> 50be5a5424db75fe85809ac81c1eeaedc9983d87
        }
        var totalEnd = performance.now();
        var iterAvg : number = iterationTimes.reduce(function(a, b) {return a + b}) / iterationTimes.length;
        iterRef.current!.innerText = `Completed in ${iterationTimes.length} iterations with total time ${totalEnd - totalStart} and average iteration time ${iterAvg}`;
    }
}

export default ForceDirected;