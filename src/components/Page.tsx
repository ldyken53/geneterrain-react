import React from 'react';
import WebGPU from '../main';
import Sidebar from './Sidebar';

type PageState = {
    nodeData: Array<number>,
    widthFactor: number,
}
class Page extends React.Component<{}, PageState> {
    constructor(props) {
      super(props);
      this.state = {nodeData: [], widthFactor: 1000};
  
    }

    setNodeData(data : Array<number>) {
        this.setState({nodeData: data});
    }

  
    render() {
      return (
        <div>
            <Sidebar setNodeData={this.setNodeData.bind(this)} />
            <WebGPU nodeData={this.state.nodeData} widthFactor={this.state.widthFactor}/>
        </div>
      );
    }
  }

export default Page;