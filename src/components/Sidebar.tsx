import React from 'react';
import {Form, Button} from "react-bootstrap";
import Collapsible from 'react-collapsible';

type SidebarProps = {
  setNodeData: (nodeData : Array<number>) => void,
  setWidthFactor: (widthFactor : number) => void,
  setPeakValue: (value : number) => void,
  setValleyValue: (value : number) => void,
  setGlobalRange: () => void,
  toggleNodeLayer: () => void,
  toggleTerrainLayer: () => void,
}
type SidebarState = {
  nodeData: Array<number>
}
class Sidebar extends React.Component<SidebarProps, SidebarState> {
    constructor(props) {
      super(props);
      this.state = {nodeData: []};
  
      this.handleSubmit = this.handleSubmit.bind(this);
      this.readFiles = this.readFiles.bind(this);
    }
  
    handleSubmit(event) {
      event.preventDefault();
      this.props.setNodeData(this.state.nodeData);
    }

    readFiles(event : React.ChangeEvent<HTMLInputElement>) {
        const files : FileList = event.target.files!;
        console.log(files);
        var nodeIDToValue = {};
        var nodeData : Array<number> = [];
        const edgeReader = new FileReader();
        edgeReader.onload = (event) => {
        //   var edgeData = (edgeReader.result as string).split("\n");
        //   for (var element of edgeData) {
        //     var parts = element.split("\t");
        //     if (nodeIDToValue[parts[0]] && nodeIDToValue[parts[1]]) {
        //       nodeElements.push({ data: { source: parts[0], target: parts[1], weight: parseFloat(parts[2]) } });
        //     }
        //   }
        //   await render(nodeData, index);
            console.log("not yet implemented edges");
        };
        const layoutReader = new FileReader();
        layoutReader.onload = (event) => {
          var layoutData = (layoutReader.result as string).split("\n");
          for (var element of layoutData) {
            var parts = element.split("\t");
            if (nodeIDToValue[parts[0]]) {
              // Pushes values to node data in order of struct for WebGPU:
              // nodeValue, nodeX, nodeY, nodeSize
              nodeData.push(parseFloat(nodeIDToValue[parts[0]]), parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
            }
          }
          this.setState({nodeData: nodeData});
          edgeReader.readAsText(files[1]);
        };
        const nodeReader = new FileReader();
        nodeReader.onload = (event) => {
          var rawNodes = (nodeReader.result as string).split("\n");
          for (var element of rawNodes) {
            nodeIDToValue[element.split("\t")[0]] = element.split("\t")[1]
          }
          layoutReader.readAsText(files[1]);
        };
        nodeReader.readAsText(files[0]);
    }
  
    render() {
      return (
        <div className="sidebar"> 
        <Form style={{color: 'white'}} onSubmit={this.handleSubmit}>
          <Form.Group controlId="formFile" className="mt-3 mb-3">
            <Form.Label>Select Example Files</Form.Label>
            <Form.Control className="form-control" type="file" multiple onChange={this.readFiles}/>
            <Button className="mt-2" type="submit" variant="secondary" value="Submit">Submit</ Button>
          </Form.Group>
          <Collapsible trigger="Terrain Options">
            <Form.Group> 
              <Form.Label> Width Factor </ Form.Label>
              <br/>
              <input type="range" defaultValue={1000} min={0} max={2000} onChange={(e) => this.props.setWidthFactor(parseFloat(e.target.value))} />
            </Form.Group>
            <Form.Group> 
              <Form.Label> Peak and Valley Values </ Form.Label>
              <br/>
              <input type="range" defaultValue={0.8} min={0.5} max={1} step={0.01} onChange={(e) => this.props.setPeakValue(parseFloat(e.target.value))} />
              <input type="range" defaultValue={0.2} min={0} max={0.5} step={0.01} onChange={(e) => this.props.setValleyValue(parseFloat(e.target.value))} />
            </Form.Group>
            <Form.Group>
              <Form.Check defaultChecked={true} onClick={(e) => this.props.setGlobalRange()} type="checkbox" label="Use Global Min/Max"></Form.Check>
            </Form.Group>
          </Collapsible>
          <Collapsible trigger="Layers"> 
            <Form.Check defaultChecked={false} onClick={(e) => this.props.toggleTerrainLayer()} type="checkbox" label="Terrain Layer"/>
            <Form.Check defaultChecked={true} onClick={(e) => this.props.toggleNodeLayer()} type="checkbox" label="Node Layer"/>
          </Collapsible>
        </Form>
        </ div>
      );
    }
  }

export default Sidebar;