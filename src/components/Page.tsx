import React from 'react';
import Sidebar from './Sidebar';
import { createRef, MutableRefObject } from 'react';
import Renderer from "../webgpu/render";
import colormap from './rainbow.png';

type PageState = {
    widthFactor: number,
    canvasRef: MutableRefObject<HTMLCanvasElement | null>,
    renderer: Renderer | null,
}
class Page extends React.Component<{}, PageState> {
    constructor(props) {
        super(props);
        this.state = {widthFactor: 1000, canvasRef: createRef<HTMLCanvasElement | null>(), renderer: null};
    }

    async componentDidMount() {
        const adapter = (await navigator.gpu.requestAdapter())!;
        const device = await adapter.requestDevice(); 
        var colormapImage = new Image();
        colormapImage.src = colormap;
        await colormapImage.decode();
        const imageBitmap = await createImageBitmap(colormapImage);
        this.setState({renderer: new Renderer(adapter, device, this.state.canvasRef, imageBitmap)});
    }

    setNodeData(nodeData : Array<number>) {
        this.state.renderer!.setNodeData(nodeData);
    }

    setWidthFactor(widthFactor : number) {
        this.state.renderer!.setWidthFactor(widthFactor);
    }

    setPeakValue(value : number) {
        this.state.renderer!.setPeakValue(value);
    }

    setValleyValue(value : number) {
        this.state.renderer!.setValleyValue(value);
    }
  
    render() {
      return (
        <div>
            <Sidebar setValleyValue={this.setValleyValue.bind(this)} setPeakValue={this.setPeakValue.bind(this)} setWidthFactor={this.setWidthFactor.bind(this)} setNodeData={this.setNodeData.bind(this)} />
            <div className="canvasContainer">
                <canvas ref={this.state.canvasRef} width={600} height={600}></canvas>
            </div>
        </div>
      );
    }
  }

export default Page;