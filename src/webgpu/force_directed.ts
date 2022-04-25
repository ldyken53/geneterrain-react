import { buffer } from 'd3';
import {
    apply_forces,
    create_adjacency_matrix,
    compute_forces,
    create_quadtree
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
    public createQuadTreePipeline : GPUComputePipeline;
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

        this.createQuadTreePipeline = device.createComputePipeline({
            compute: {
                module: device.createShaderModule({
                    code: create_quadtree
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

    formatToD3Format(positionList, edgeList, nLength, eLength) {
        let nodeArray1 = new Array(nLength);
        let edgeArray1 = new Array(eLength / 2);
    
        for (let i = 0; i < 4 * nLength; i = i + 4) {
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
        nodeLength: number = 0, edgeLength: number = 0, 
        coolingFactor = this.coolingFactor, l = 0.05, 
        iterationCount = this.iterationCount, 
        threshold = this.threshold,
        iterRef, edgeList
    ) {
        iterationCount = 2000;
        l = 0.01;
        coolingFactor = 0.9975;
        if (nodeLength == 0 || edgeLength == 0) {
            return;
        }
        console.log(l);
        console.log(coolingFactor);
        this.coolingFactor = 2.0;
        this.nodeDataBuffer = nodeDataBuffer;
        this.edgeDataBuffer = edgeDataBuffer;
        this.threshold = threshold;
        this.force = 100000;
        var totalStart = performance.now();


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
        var adjMatrixSize = Math.ceil((nodeLength * nodeLength * 4) / 32);
        adjMatrixSize = adjMatrixSize + (4 - adjMatrixSize % 4); 
        console.log(adjMatrixSize);
        this.adjMatrixBuffer = this.device.createBuffer({
            size: adjMatrixSize,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
        });
        // this.laplacianBuffer = this.device.createBuffer({
        //     size: nodeLength * nodeLength * 4,
        //     usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
        // });
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
                // {
                //     binding: 3,
                //     resource: {
                //         buffer: this.laplacianBuffer
                //     }
                // }
            ]
        });

        var pass = commandEncoder.beginComputePass();
        pass.setBindGroup(0, createBindGroup);
        pass.setPipeline(this.createMatrixPipeline);
        pass.dispatch(1, 1, 1);      
        pass.endPass();
        // Log adjacency matrix
        const gpuReadBuffer = this.device.createBuffer({
            size: adjMatrixSize,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
        });
        // Encode commands for copying buffer to buffer.
        commandEncoder.copyBufferToBuffer(
            this.adjMatrixBuffer /* source buffer */ ,
            0 /* source offset */ ,
            gpuReadBuffer /* destination buffer */ ,
            0 /* destination offset */ ,
            adjMatrixSize /* size */
        );
        this.device.queue.submit([commandEncoder.finish()]);
        
        // Log adjacency matrix (count should be equal to the number of nonduplicate edges)
        await gpuReadBuffer.mapAsync(GPUMapMode.READ);
        const arrayBuffer = gpuReadBuffer.getMappedRange();
        var output = new Uint32Array(arrayBuffer);
        var count = 0;
        // for (var i = 0; i < output.length; i++) {
        //     count+=output[i];
        // }
        // console.log(output);
        // console.log(count);
        // console.log(output.length);

        this.forceDataBuffer = this.device.createBuffer({
            size: nodeLength * 2 * 4,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
        });

        var iterationTimes : Array<number> = [];
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
                },
                // {
                //     binding: 2,
                //     resource: {
                //         buffer: this.paramsBuffer,
                //     },
                // },
            ],
        });
        var batchBuffer = this.device.createBuffer({
            size: 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        let positionReadBuffer = this.device.createBuffer({
            size: nodeLength * 4 * 4,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
        });
        const shuffleArray = array => {
            for (let i = array.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              const temp = array[i];
              array[i] = array[j];
              array[j] = temp;
            }
          }
        // iterationCount = 1;
        while (iterationCount > 0 && this.coolingFactor > 0.0001 && this.force >= 0) {
            var randomStart = performance.now();
            const randomBuffer = this.device.createBuffer({
                size: nodeLength * 4,
                usage: GPUBufferUsage.STORAGE,
                mappedAtCreation: true 
            });
            let randomArray = Array.from(Array(nodeLength),(x,i)=>i);
            shuffleArray(randomArray);
            var mapping = randomBuffer.getMappedRange();
            new Uint32Array(mapping).set(randomArray);
            randomBuffer.unmap();
            var randomEnd = performance.now();
            console.log("random time", randomEnd - randomStart);
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
                    },
                    {
                        binding: 4,
                        resource: {
                            buffer: batchBuffer
                        }
                    },
                    {
                        binding: 5,
                        resource: {
                            buffer: randomBuffer,
                        }
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
            for (var i = 0; i < 1; i++) {
                var upload = this.device.createBuffer({
                    size: 4,
                    usage: GPUBufferUsage.COPY_SRC,
                    mappedAtCreation: true,
                });
                var mapping = upload.getMappedRange();
                new Uint32Array(mapping).set([Math.ceil(nodeLength / 4)]);
                upload.unmap();
                commandEncoder.copyBufferToBuffer(upload, 0, batchBuffer, 0, 4);
                var pass = commandEncoder.beginComputePass();
                pass.setBindGroup(0, bindGroup);
                pass.setPipeline(this.computeForcesPipeline);
                pass.dispatch(nodeLength, 1, 1);
                pass.endPass();
                this.device.queue.submit([commandEncoder.finish()]);
                // await this.device.queue.onSubmittedWorkDone();
                var commandEncoder = this.device.createCommandEncoder();
            }
            // var pass = commandEncoder.beginComputePass();
            // pass.setBindGroup(0, bindGroup);
            // pass.setPipeline(this.computeForcesPipeline);
            // pass.dispatch(nodeLength, 1, 1);
            // pass.endPass();

            // Testing timing of both passes (comment out when not debugging)
            // pass.endPass();
            // this.device.queue.submit([commandEncoder.finish()]);
            // var start : number = performance.now();
            // await this.device.queue.onSubmittedWorkDone();
            // var end : number = performance.now();
            // console.log(`compute force time: ${end - start}`)
            // var commandEncoder = this.device.createCommandEncoder();

            const gpuReadBuffer = this.device.createBuffer({
                size: nodeLength * 2 * 4,
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
            });
            // Encode commands for copying buffer to buffer.
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

            commandEncoder.copyBufferToBuffer(
                this.nodeDataBuffer,
                0,
                positionReadBuffer,
                0,
                nodeLength * 4 * 4
            );

            this.device.queue.submit([commandEncoder.finish()]);
            var start : number = performance.now();
            await this.device.queue.onSubmittedWorkDone();
            var end : number = performance.now();
            console.log(`iteration time ${end - start}`)
            // iterationTimes.push(end - start);

            // this.maxForceResultBuffer.unmap();
            // Read all of the forces applied.
            // await gpuReadBuffer.mapAsync(GPUMapMode.READ);
            // const arrayBuffer = gpuReadBuffer.getMappedRange();
            // var output2 = new Float32Array(arrayBuffer);
            // console.log(output2);
            this.coolingFactor = this.coolingFactor * coolingFactor;
            
        }
        await positionReadBuffer.mapAsync(GPUMapMode.READ);
        let positionArrayBuffer = positionReadBuffer.getMappedRange();
        let positionList = new Float32Array(positionArrayBuffer);

        await this.device.queue.onSubmittedWorkDone();
        var totalEnd = performance.now();
        if (iterationTimes.length > 0) {
            var iterAvg : number = iterationTimes.reduce(function(a, b) {return a + b}) / iterationTimes.length;
        } else {
            var iterAvg : number = (totalEnd - totalStart) / 2000;
        }
        iterRef.current!.innerText = `Completed in ${2000} iterations with total time ${totalEnd - totalStart} and average iteration time ${iterAvg}`;
        let d3Format = this.formatToD3Format(
            positionList,
            edgeList,
            nodeLength,
            edgeLength
          );
        let formattedNodeList = d3Format.nodeArray;
        let formattedEdgeList = d3Format.edgeArray;
        console.log(formattedNodeList, formattedEdgeList);
        const element = document.createElement("a");
        const textFile = new Blob([JSON.stringify(formattedEdgeList)], {type: 'application/json'});
        element.href = URL.createObjectURL(textFile);
        element.download = "FR_edges.json";
        document.body.appendChild(element); 
        element.click();
        const element2 = document.createElement("a");
        const textFile2 = new Blob([JSON.stringify(formattedNodeList)], {type: 'application/json'});
        element.href = URL.createObjectURL(textFile2);
        element.download = "FR_nodes.json";
        document.body.appendChild(element2); 
        element.click();
    }
}

export default ForceDirected;