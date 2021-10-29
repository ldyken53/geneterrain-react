import { compute_terrain, normalize_terrain } from './wgsl';

class TerrainGenerator {
    public rangeBuffer : GPUBuffer;
    public pixelValueBuffer : GPUBuffer;
    public paramsBuffer : GPUBuffer;
    public nodeDataBuffer : GPUBuffer;
    public device : GPUDevice;
    public width : number;
    public height : number;
    public computeTerrainPipeline : GPUComputePipeline;
    public normalizeTerrainPipeline : GPUComputePipeline;
    public computeTerrainBGLayout : GPUBindGroupLayout;
    public normalizeTerrainBGLayout : GPUBindGroupLayout;
    public nodeData : Array<number> = [];
    
    constructor(device : GPUDevice, width, height) {
        this.device = device;
        this.width = width;
        this.height = height;

        this.nodeDataBuffer = this.device.createBuffer({
            size: 16,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
        this.rangeBuffer = this.device.createBuffer({
            size: 2 * 4,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
        });

        var storage : GPUBufferBindingType = "storage";
        var uniform : GPUBufferBindingType = "uniform";
        this.computeTerrainBGLayout = device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: storage,
                    }
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: uniform,
                    }
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: storage,
                    }
                },
                {
                    binding: 3,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: storage,
                    }
                }
            ],
        });

        this.computeTerrainPipeline = device.createComputePipeline({
            layout: device.createPipelineLayout({
                bindGroupLayouts: [this.computeTerrainBGLayout],
            }),
            compute: {
                module: device.createShaderModule({
                    code: compute_terrain,
                }),
                entryPoint: "main",
            },
        });

        this.normalizeTerrainBGLayout = device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: storage,
                    }
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: uniform,
                    }
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: storage,
                    }
                }
            ],
        });

        this.normalizeTerrainPipeline = device.createComputePipeline({
            layout: device.createPipelineLayout({
                bindGroupLayouts: [this.normalizeTerrainBGLayout],
            }),
            compute: {
                module: device.createShaderModule({
                    code: normalize_terrain,
                }),
                entryPoint: "main",
            },
        });

        // Create a buffer to store the params, output, and min/max
        this.paramsBuffer = device.createBuffer({
            size: 8 * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.pixelValueBuffer = device.createBuffer({
            size: this.width * this.height * 4,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
        });
    }

    computeTerrain(nodeData = this.nodeData, widthFactor = 1000, translation = [0, 0, 1, 1], globalRange = null) {
        if (nodeData.length == 0) {
            return;
        }
        this.nodeData = nodeData;
        // Set up node data buffer
        this.nodeDataBuffer = this.device.createBuffer({
            size: nodeData.length * 4,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true,
        });
        new Float32Array(this.nodeDataBuffer.getMappedRange()).set(nodeData);
        this.nodeDataBuffer.unmap();

        // Have to reset range buffer unless global range checked
        if (!globalRange) {
            this.rangeBuffer = this.device.createBuffer({
                size: 2 * 4,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
            });
        } else {
            this.rangeBuffer = globalRange;
        }

        // Set up params (image width, height, node length, and width factor)
        var upload = this.device.createBuffer({
            size: 8 * 4,
            usage: GPUBufferUsage.COPY_SRC,
            mappedAtCreation: true,
        });
        var mapping = upload.getMappedRange();
        new Uint32Array(mapping).set([this.width, this.height, nodeData.length / 4]);
        new Float32Array(mapping).set([widthFactor, translation[0], translation[1], translation[2], translation[3]], 3);
        upload.unmap();
        //this.device.createQuerySet({})
        var commandEncoder = this.device.createCommandEncoder();
        //commandEncoder.writeTimestamp();
        commandEncoder.copyBufferToBuffer(upload, 0, this.paramsBuffer, 0, 8 * 4);
        // Create bind group
        var bindGroup = this.device.createBindGroup({
            layout: this.computeTerrainBGLayout,
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
                },
                {
                    binding: 2,
                    resource: {
                        buffer: this.pixelValueBuffer,
                    },
                },
                {
                    binding: 3,
                    resource: {
                        buffer: this.rangeBuffer,
                    },
                },
            ],
        });

        // Run compute terrain pass
        var pass = commandEncoder.beginComputePass();
        pass.setBindGroup(0, bindGroup);
        pass.setPipeline(this.computeTerrainPipeline);
        pass.dispatch(this.width, this.height, 1);
        pass.endPass();
        //commandEncoder.writeTimestamp();
        this.device.queue.submit([commandEncoder.finish()]);
        // await this.device.queue.onSubmittedWorkDone();

        // Look into submitting normalization and compute in one pass to improve speed, remove synchronizations
        // Use writetimestamp for more accurate kernel timing

        // Run normalize terrain pass
        var bindGroup = this.device.createBindGroup({
            layout: this.normalizeTerrainBGLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.pixelValueBuffer,
                    },
                },
                {
                    binding: 1,
                    resource: {
                        buffer: this.paramsBuffer,
                    },
                },
                {
                    binding: 2,
                    resource: {
                        buffer: this.rangeBuffer,
                    },
                },
            ],
        });
        var commandEncoder = this.device.createCommandEncoder();
        var pass = commandEncoder.beginComputePass();
        pass.setBindGroup(0, bindGroup);
        pass.setPipeline(this.normalizeTerrainPipeline);
        pass.dispatch(this.width, this.height, 1);
        pass.endPass();
        this.device.queue.submit([commandEncoder.finish()]);
        // await this.device.queue.onSubmittedWorkDone();
    }
}

export default TerrainGenerator;