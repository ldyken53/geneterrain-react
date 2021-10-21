import React from 'react';
import { initWebGPU } from '../webgpu/init';
import Sidebar from './Sidebar';
import { createRef, MutableRefObject } from 'react';


type PageState = {
    nodeData: Array<number>,
    widthFactor: number,
    canvasRef: MutableRefObject<HTMLCanvasElement | null>
}
class Page extends React.Component<{}, PageState> {
    constructor(props) {
        super(props);
        this.state = {nodeData: [], widthFactor: 1000, canvasRef: createRef<HTMLCanvasElement | null>()};
    }

    componentDidMount() {
        console.log("mount");
        try {
            const p = initWebGPU(this.state.canvasRef);
    
            if (p instanceof Promise) {
                p.catch((err: Error) => {
                console.error(err);
                });
            }
        } catch (err) {
        console.error(err);
        }
    }

    setNodeData(data : Array<number>) {
        this.setState({nodeData: data});
    }

  
    render() {
      return (
        <div>
            <Sidebar setNodeData={this.setNodeData.bind(this)} />
            <div className="canvasContainer">
                <canvas ref={this.state.canvasRef} width={600} height={600}></canvas>
            </div>
        </div>
      );
    }
  }

export default Page;