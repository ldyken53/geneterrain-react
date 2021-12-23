import React from 'react';
import Sidebar from './Sidebar';
import { createRef, MutableRefObject } from 'react';
import Renderer from "../webgpu/render";
import colormap from './rainbow.png';

type PageState = {
    widthFactor: number,
    canvasRef: MutableRefObject<HTMLCanvasElement | null>,
    outCanvasRef: MutableRefObject<HTMLCanvasElement | null>,
    renderer: Renderer | null,
}
class Page extends React.Component<{}, PageState> {
    constructor(props) {
        super(props);
        this.state = {
            widthFactor: 1000, 
            canvasRef: createRef<HTMLCanvasElement | null>(), 
            outCanvasRef: createRef<HTMLCanvasElement | null>(), 
            renderer: null
        };
    }

    async componentDidMount() {
        const adapter = (await navigator.gpu.requestAdapter())!;
        const device = await adapter.requestDevice(); 
        var colormapImage = new Image();
        colormapImage.src = colormap;
        await colormapImage.decode();
        const imageBitmap = await createImageBitmap(colormapImage);
        this.setState({renderer: new Renderer(
            adapter, device, this.state.canvasRef, 
            imageBitmap, colormapImage, this.state.outCanvasRef)
        });
    }

    setNodeEdgeData(nodeData : Array<number>, edgeData : Array<number>) {
        this.state.renderer!.setNodeEdgeData(nodeData, edgeData);
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

    setIdealLength(value : number) {
        this.state.renderer!.setIdealLength(value);
    }

    setCoolingFactor(value : number) {
        this.state.renderer!.setCoolingFactor(value);
    }

    setGlobalRange() {
        this.state.renderer!.setGlobalRange();
    }

    toggleNodeLayer() {
        this.state.renderer!.toggleNodeLayer();
    }

    toggleTerrainLayer() {
        this.state.renderer!.toggleTerrainLayer();
    }

    toggleEdgeLayer() {
        this.state.renderer!.toggleEdgeLayer();
    }

    runForceDirected() {
        this.state.renderer!.runForceDirected();
    }

    onSave() {
        this.state.renderer!.onSave();
    }
  
    render() {
      return (
        <div>
            <Sidebar 
                setValleyValue={this.setValleyValue.bind(this)} 
                setPeakValue={this.setPeakValue.bind(this)} 
                setWidthFactor={this.setWidthFactor.bind(this)} 
                setNodeEdgeData={this.setNodeEdgeData.bind(this)} 
                setGlobalRange={this.setGlobalRange.bind(this)}
                setIdealLength={this.setIdealLength.bind(this)}
                setCoolingFactor={this.setCoolingFactor.bind(this)}
                toggleNodeLayer={this.toggleNodeLayer.bind(this)}
                toggleTerrainLayer={this.toggleTerrainLayer.bind(this)}
                toggleEdgeLayer={this.toggleEdgeLayer.bind(this)}
                runForceDirected={this.runForceDirected.bind(this)}
                onSave={this.onSave.bind(this)}
            />
            <div className="canvasContainer">
                <canvas ref={this.state.canvasRef} width={800} height={800}></canvas>
                <canvas hidden={true} ref={this.state.outCanvasRef} width={800} height={800}></canvas>
            </div>
        </div>
      );
    }
  }

export default Page;