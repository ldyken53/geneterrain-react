import {
    compute_forces,
    apply_forces
} from './wgsl';

class ForceDirected {
    public paramsBuffer: GPUBuffer;
    public nodeDataBuffer: GPUBuffer;
    public edgeDataBuffer: GPUBuffer;
    public forceDataBuffer: GPUBuffer;
    public coolingFactor: number = 0.99;
    public device: GPUDevice;
    public computeForcesPipeline: GPUComputePipeline;
    public applyForcesPipeline: GPUComputePipeline;
    public iterationCount: number = 1000;

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

    async runForces(nodeDataBuffer = this.nodeDataBuffer, edgeDataBuffer = this.edgeDataBuffer, nodeLength: number = 0, edgeLength: number = 0, coolingFactor = this.coolingFactor, l = 0.1, iterationCount = this.iterationCount) {
        if (nodeLength == 0 || edgeLength == 0) {
            return;
        }

        console.log(this.paramsBuffer);
        this.coolingFactor = coolingFactor;
        this.nodeDataBuffer = nodeDataBuffer;
        this.edgeDataBuffer = edgeDataBuffer;

        this.forceDataBuffer = this.device.createBuffer({
            size: nodeLength * 2 * 4,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
        });
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
                    },
                    {
                        binding: 3,
                        resource: {
                            buffer: this.paramsBuffer,
                        },
                    }
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
                    }
                ],
            });
            pass.setBindGroup(0, bindGroup);
            pass.setPipeline(this.applyForcesPipeline);
            pass.dispatch(nodeLength, 1, 1);
            pass.endPass();

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
        }
    }
}

export default ForceDirected;