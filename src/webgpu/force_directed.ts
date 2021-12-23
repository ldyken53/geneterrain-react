import { compute_forces, apply_forces } from './wgsl';

class ForceDirected {
    public paramsBuffer : GPUBuffer;
    public nodeDataBuffer : GPUBuffer;
    public device : GPUDevice;
    public computeForcesPipeline : GPUComputePipeline;
    public applyForcesPipeline : GPUComputePipeline;
    
    constructor(device : GPUDevice) {
        this.device = device;

        this.nodeDataBuffer = this.device.createBuffer({
            size: 16,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
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
            size: 8 * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
    }

    computeForces(nodeDataBuffer = this.nodeDataBuffer, nodeLength : number = 0) {
        if (nodeLength == 0) {
            return;
        }
        this.nodeDataBuffer = nodeDataBuffer;

        // Set up params (image width, height, node length, and width factor)
        var upload = this.device.createBuffer({
            size: 8 * 4,
            usage: GPUBufferUsage.COPY_SRC,
            mappedAtCreation: true,
        });
        var mapping = upload.getMappedRange();
        upload.unmap();
        //this.device.createQuerySet({})
        var commandEncoder = this.device.createCommandEncoder();
        //commandEncoder.writeTimestamp();
        commandEncoder.copyBufferToBuffer(upload, 0, this.paramsBuffer, 0, 8 * 4);
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
                        buffer: this.paramsBuffer,
                    },
                }
            ],
        });

        // Run compute terrain pass
        var pass = commandEncoder.beginComputePass();
        pass.setBindGroup(0, bindGroup);
        pass.setPipeline(this.computeForcesPipeline);
        pass.dispatch(nodeLength, 1, 1);
        //commandEncoder.writeTimestamp();
        // await this.device.queue.onSubmittedWorkDone();

        // Look into submitting normalization and compute in one pass to improve speed, remove synchronizations
        // Use writetimestamp for more accurate kernel timing

        // Run normalize terrain pass
        var bindGroup = this.device.createBindGroup({
            layout: this.applyForcesPipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 1,
                    resource: {
                        buffer: this.paramsBuffer,
                    },
                },
            ],
        });
        pass.setBindGroup(0, bindGroup);
        pass.setPipeline(this.applyForcesPipeline);
        pass.dispatch(nodeLength, 1, 1);
        pass.endPass();
        this.device.queue.submit([commandEncoder.finish()]);
        // await this.device.queue.onSubmittedWorkDone();
    }
}

export default ForceDirected;