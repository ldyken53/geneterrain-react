import React from 'react';
import Sidebar from './Sidebar';
import { createRef, MutableRefObject } from 'react';
import Renderer from "../webgpu/render";
import colormap from './rainbow.png';
import colormap2 from './rainbow2.png';
import { Form } from 'react-bootstrap';

type PageState = {
    widthFactor: number,
    canvasRef: MutableRefObject<HTMLCanvasElement | null>,
    outCanvasRef: MutableRefObject<HTMLCanvasElement | null>,
    colorCanvasRef: MutableRefObject<HTMLCanvasElement | null>,
    fpsRef: MutableRefObject<HTMLLabelElement | null>,
    iterRef: MutableRefObject<HTMLLabelElement | null>,
    colorValley : number,
    colorHill : number,
    colorMountain : number,
    renderer: Renderer | null,
}
class Page extends React.Component<{}, PageState> {
    constructor(props) {
        super(props);
        this.state = {
            widthFactor: 1000, 
            canvasRef: createRef<HTMLCanvasElement | null>(), 
            outCanvasRef: createRef<HTMLCanvasElement | null>(), 
            colorCanvasRef: createRef<HTMLCanvasElement | null>(), 
            fpsRef: createRef<HTMLLabelElement | null>(),
            iterRef: createRef<HTMLLabelElement | null>(),
            colorValley: 45,
            colorHill: 90,
            colorMountain: 135,
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
            imageBitmap, colormapImage, this.state.outCanvasRef, this.state.fpsRef, this.state.iterRef)
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

    setColorValley(value : number) {
        this.setState({colorValley: value});
        this.updateColormap();
    }

    setColorHill(value : number) {
        this.setState({colorHill: value});
        this.updateColormap();
    }

    setColorMountain(value : number) {
        this.setState({colorMountain: value});
        this.updateColormap();
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

    async updateColormap() {
        var colormapImage = new Image();
        colormapImage.src = colormap2;
        await colormapImage.decode();
        var colorCanvas = this.state.colorCanvasRef.current!;
        var context = colorCanvas.getContext('2d')!;
        context.drawImage(colormapImage, 0, 0);
        let data = context.getImageData(0, 0, 180, 1);
        for (var i = 0; i < this.state.colorValley; i++) {
            data.data[i * 4] = 0;
            data.data[i * 4 + 1] = 0 + (255/this.state.colorValley) * i;
            data.data[i * 4 + 2] = 255;
            data.data[i * 4 + 3] = 255;
        }
        for (var i = this.state.colorValley; i < this.state.colorHill; i++) {
            data.data[i * 4] = 0;
            data.data[i * 4 + 1] = 255;
            data.data[i * 4 + 2] = 255 - (255/(this.state.colorHill-this.state.colorValley)) * (i - this.state.colorValley);
            data.data[i * 4 + 3] = 255;
        }
        for (var i = this.state.colorHill; i < this.state.colorMountain; i++) {
            data.data[i * 4] = 0 + (255/(this.state.colorMountain-this.state.colorHill)) * (i-this.state.colorHill);
            data.data[i * 4 + 1] = 255;
            data.data[i * 4 + 2] = 0;
            data.data[i * 4 + 3] = 255;
        }
        for (var i = this.state.colorMountain; i < 180; i++) {
            data.data[i * 4] = 255;
            data.data[i * 4 + 1] = 255 - (255/(180-this.state.colorMountain)) * (i-this.state.colorMountain);
            data.data[i * 4 + 2] = 0;
            data.data[i * 4 + 3] = 255;
        }
        context.putImageData(data, 0, 0);
        let url = colorCanvas.toDataURL();
        colormapImage.src = url;
        await colormapImage.decode();
        const imageBitmap = await createImageBitmap(colormapImage);
        this.state.renderer!.setColormap(imageBitmap, colormapImage);
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
                setColorHill={this.setColorHill.bind(this)}
                setColorValley={this.setColorValley.bind(this)}
                setColorMountain={this.setColorMountain.bind(this)}
                onSave={this.onSave.bind(this)}
            />
            <div className="canvasContainer">
                <Form.Label className={"out"} ref={this.state.fpsRef} >FPS: n/a</Form.Label>
                <br/>
                <Form.Label className={"out"} ref={this.state.iterRef} ></Form.Label>
                <canvas ref={this.state.canvasRef} width={800} height={800}></canvas>
                <canvas hidden={true} ref={this.state.outCanvasRef} width={800} height={800}></canvas>
                <canvas hidden={true} ref={this.state.colorCanvasRef} width={180} height={1}></canvas>
            </div>
        </div>
      );
    }
  }

export default Page;