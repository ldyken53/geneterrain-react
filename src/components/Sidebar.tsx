import React from 'react';
import {Form, Button} from "react-bootstrap";
import Collapsible from 'react-collapsible';
import { Matrix, matrix, subtract, eigs, column, min, max, index, sparse } from 'mathjs';

type SidebarProps = {
  setNodeEdgeData: (nodeData : Array<number>, edgeData : Array<number>) => void,
  setWidthFactor: (widthFactor : number) => void,
  setPeakValue: (value : number) => void,
  setValleyValue: (value : number) => void,
  setCoolingFactor: (value : number) => void,
  setIdealLength: (value : number) => void,
  setColorValley: (value : number) => void,
  setColorHill: (value : number) => void,
  setColorMountain: (value : number) => void,
  setGlobalRange: () => void,
  toggleNodeLayer: () => void,
  toggleTerrainLayer: () => void,
  toggleEdgeLayer: () => void,
  runForceDirected: () => void,
  onSave: () => void,
}
type SidebarState = {
  nodeData: Array<number>,
  edgeData: Array<number>,
  laplacian: Matrix,
  adjacencyMatrix: Array<Array<number>>,
  e: {}
}
class Sidebar extends React.Component<SidebarProps, SidebarState> {
    constructor(props) {
      super(props);
      this.state = {nodeData: [], edgeData: [], laplacian: sparse([]), adjacencyMatrix: [], e: {}};
  
      this.handleSubmit = this.handleSubmit.bind(this);
      this.readFiles = this.readFiles.bind(this);
    }
  
    handleSubmit(event) {
      event.preventDefault();
      this.props.setNodeEdgeData(this.state.nodeData, this.state.edgeData);
    }

    readFiles(event : React.ChangeEvent<HTMLInputElement>) {
        const files : FileList = event.target.files!;
        console.log(files);
        var nodeIDToValue = {};
        var nodeIDToPos = {};
        var nodeIDToIndex = {};
        var nodeData : Array<number> = [];
        var edgeData : Array<number> = [];
        var degreeMatrix : Array<Array<number>> = [];
        var adjacencyMatrix : Array<Array<number>> = [];
        const edgeReader = new FileReader();
        edgeReader.onload = (event) => {
          var edgeRaw = (edgeReader.result as string).split("\n");
          for (var element of edgeRaw) {
            var parts = element.split("\t");
            if (nodeIDToValue[parts[0]] && nodeIDToValue[parts[1]]) {
              edgeData.push(
                nodeIDToIndex[parts[0]], 
                nodeIDToIndex[parts[1]],
              );
              degreeMatrix[nodeIDToIndex[parts[0]]][nodeIDToIndex[parts[0]]] += 1;
              degreeMatrix[nodeIDToIndex[parts[1]]][nodeIDToIndex[parts[1]]] += 1;
              adjacencyMatrix[nodeIDToIndex[parts[0]]][nodeIDToIndex[parts[1]]] += 1;
              adjacencyMatrix[nodeIDToIndex[parts[1]]][nodeIDToIndex[parts[0]]] += 1;
            }
          }
          this.setState({edgeData: edgeData});
          var laplacian : Matrix = subtract(sparse(degreeMatrix), sparse(adjacencyMatrix)) as Matrix;
          console.log(laplacian);
          this.setState({laplacian: laplacian, adjacencyMatrix: adjacencyMatrix});
        };
        const layoutReader = new FileReader();
        layoutReader.onload = (event) => {
          var layoutData = (layoutReader.result as string).split("\n");
          for (var element of layoutData) {
            var parts = element.split("\t");
            if (nodeIDToValue[parts[0]]) {
              nodeIDToIndex[parts[0]] = nodeData.length / 4;
              // Pushes values to node data in order of struct for WebGPU:
              // nodeValue, nodeX, nodeY, nodeSize
              nodeData.push(parseFloat(nodeIDToValue[parts[0]]), parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
              nodeIDToPos[parts[0]] = [parseFloat(parts[1]) * 2.0 - 1, parseFloat(parts[2]) * 2.0 - 1];
            }
          }
          this.setState({nodeData: nodeData});
          for (var i = 0; i < nodeData.length / 4; i++) {
            degreeMatrix.push([]);
            adjacencyMatrix.push([]);
            for (var j = 0; j < nodeData.length / 4; j++) {
              degreeMatrix[i].push(0);
              adjacencyMatrix[i].push(0);
            }
          }
          edgeReader.readAsText(files[2]);
        };
        const nodeReader = new FileReader();
        nodeReader.onload = (event) => {
          var rawNodes = (nodeReader.result as string).split("\n");
          for (var element of rawNodes) {
            nodeIDToValue[element.split("\t")[0]] = element.split("\t")[1]
          }
          console.log(nodeIDToValue);
          layoutReader.readAsText(files[1]);
        };
        nodeReader.readAsText(files[0]);
    }

    applySpectral() {
      var e = eigs(this.state.laplacian);
      console.log(e);
      var nodeData = this.state.nodeData;
      var x = column(e.vectors, 1) as Matrix;
      var y = column(e.vectors, 2) as Matrix;
      var x_max = max(x);
      var y_max = max(y);
      var x_min = min(x);
      var y_min = min(y);
      for (var i = 0; i < nodeData.length / 4; i++) {
        nodeData[i * 4 + 1] = (x.get([i, 0]) - x_min) / (x_max - x_min);
        nodeData[i * 4 + 2] = (y.get([i, 0]) - y_min) / (y_max - y_min);
      }
      this.setState({nodeData: nodeData});
      this.props.setNodeEdgeData(nodeData, this.state.edgeData);
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
          <Collapsible trigger="Colormap Options"> 
            <Form.Row>
              <div>Valley</div>
              <input type="range" defaultValue={45} min={1} max={60} step={1} onChange={(e) => this.props.setColorValley(parseFloat(e.target.value))} />
            </Form.Row>
            <Form.Row>
              <div>Hill</div>
              <input type="range" defaultValue={90} min={61} max={120} step={1} onChange={(e) => this.props.setColorHill(parseFloat(e.target.value))} />
            </Form.Row>
            <Form.Row>
              <div>Mountain</div>
              <input type="range" defaultValue={135} min={121} max={180} step={1} onChange={(e) => this.props.setColorMountain(parseFloat(e.target.value))} />
            </Form.Row>
          </Collapsible>
          <Collapsible trigger="Layers"> 
            <Form.Check defaultChecked={false} onClick={(e) => this.props.toggleTerrainLayer()} type="checkbox" label="Terrain Layer"/>
            <Form.Check defaultChecked={true} onClick={(e) => this.props.toggleNodeLayer()} type="checkbox" label="Node Layer"/>
            <Form.Check defaultChecked={true} onClick={(e) => this.props.toggleEdgeLayer()} type="checkbox" label="Edge Layer"/>
          </Collapsible>
          <Collapsible trigger="Force Directed Options">
            <Form.Label> Ideal Length and Cooling Factor </Form.Label>
            <br/>
            <input type="range" defaultValue={0.01} min={0.001} max={0.1} step={0.001} onChange={(e) => this.props.setIdealLength(parseFloat(e.target.value))} />
            <input type="range" defaultValue={0.99} min={0.75} max={0.999} step={0.001} onChange={(e) => this.props.setCoolingFactor(parseFloat(e.target.value))} />
          </Collapsible>
          <Button onClick={(e) => this.props.onSave()}>
            Save Terrain
          </Button>
          <Button onClick={(e) => this.applySpectral()}>
            Apply Spectral Layout
          </Button>
          <Button onClick={(e) => this.props.runForceDirected()}>
            Run Force Directed Layout
          </Button>
        </Form>
        </ div>
      );
    }
  }

export default Sidebar;