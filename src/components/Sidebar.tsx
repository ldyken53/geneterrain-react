import React from 'react';
import {Form, Button} from "react-bootstrap";
import Collapsible from 'react-collapsible';
import { Matrix, matrix, subtract, eigs, column, min, max, index, sparse } from 'mathjs';
import XMLWriter from 'xml-writer';

type SidebarProps = {
  setNodeEdgeData: (nodeData : Array<number>, edgeData : Array<number>, sourceEdges : Array<number>, targetEdges : Array<number>) => void,
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
  onSave: (post : boolean, id: number | null, name: string | null) => void,
}
type SidebarState = {
  nodeData: Array<number>,
  edgeData: Array<number>,
  sourceEdges: Array<number>,
  targetEdges: Array<number>,
  laplacian: Matrix,
  adjacencyMatrix: Array<Array<number>>,
  e: {},
  jsonFormat: boolean,
  terrainID: number,
  terrainName: string
}
type edge = {
  source: number,
  target: number
}
type node = {
  name: string,
  x: number,
  y: number
}
type Graph = {
  nodes: Array<node>,
  edges: Array<edge>
}
class Sidebar extends React.Component<SidebarProps, SidebarState> {
    constructor(props) {
      super(props);
      this.state = {
        nodeData: [], edgeData: [], sourceEdges: [], targetEdges: [], laplacian: sparse([]), 
        adjacencyMatrix: [], e: {}, jsonFormat: true, terrainID: 0, terrainName: "" 
      };
  
      this.handleSubmit = this.handleSubmit.bind(this);
      this.postImage = this.postImage.bind(this);
      this.readFiles = this.readFiles.bind(this);
    }
  
    handleSubmit(event) {
      event.preventDefault();
      this.props.setNodeEdgeData(this.state.nodeData, this.state.edgeData, this.state.sourceEdges, this.state.targetEdges);
    }

    postImage(event) {
      event.preventDefault();
      console.log(`name ${this.state.terrainName} id ${this.state.terrainID}`);
      this.props.onSave(true, this.state.terrainID, this.state.terrainName);
    }

    readFiles(event : React.ChangeEvent<HTMLInputElement>) {
        const files : FileList = event.target.files!;
        console.log(files);
        var nodeIDToValue = {};
        // var nodeIDToPos = {};
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
              // nodeIDToPos[parts[0]] = [parseFloat(parts[1]) * 2.0 - 1, parseFloat(parts[2]) * 2.0 - 1];
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

    readJson(event : React.ChangeEvent<HTMLInputElement>) {
      const files : FileList = event.target.files!;
      const jsonReader = new FileReader();
      var nodeData : Array<number> = [];
      var edgeData : Array<number> = [];
      var sourceEdges : Array<number> = [];
      var targetEdges : Array<number> = [];
      jsonReader.onload = (event) => {
        var graph : Graph = JSON.parse(jsonReader.result as string);
        console.log(graph);
        for (var i = 0; i < graph.nodes.length; i++) {
          if (graph.nodes[i].x) {
            nodeData.push(0.0, graph.nodes[i].x, graph.nodes[i].y, 1.0);
          } else {
            nodeData.push(0.0, Math.random(), Math.random(), 1.0);
          }
        }
        for (var i = 0; i < graph.edges.length; i++) {
          var source = graph.edges[i].source;
          var target = graph.edges[i].target;
          edgeData.push(source, target);
        }
        graph.edges.sort(function(a,b) {return (a.source > b.source) ? 1 : ((b.source > a.source) ? -1 : 0);} );
        for (var i = 0; i < graph.edges.length; i++) {
          var source = graph.edges[i].source;
          var target = graph.edges[i].target;
          sourceEdges.push(source, target);
        }
        console.log(sourceEdges);
        graph.edges.sort(function(a,b) {return (a.target > b.target) ? 1 : ((b.target > a.target) ? -1 : 0);} );
        for (var i = 0; i < graph.edges.length; i++) {
          var source = graph.edges[i].source;
          var target = graph.edges[i].target;
          targetEdges.push(source, target);
        }
        console.log(graph.edges);
        this.setState({nodeData: nodeData, edgeData: edgeData, sourceEdges: sourceEdges, targetEdges: targetEdges});
      };
      jsonReader.readAsText(files[0]);
    }

    // applySpectral() {
    //   var e = eigs(this.state.laplacian);
    //   console.log(e);
    //   var nodeData = this.state.nodeData;
    //   var x = column(e.vectors, 1) as Matrix;
    //   var y = column(e.vectors, 2) as Matrix;
    //   var x_max = max(x);
    //   var y_max = max(y);
    //   var x_min = min(x);
    //   var y_min = min(y);
    //   for (var i = 0; i < nodeData.length / 4; i++) {
    //     nodeData[i * 4 + 1] = (x.get([i, 0]) - x_min) / (x_max - x_min);
    //     nodeData[i * 4 + 2] = (y.get([i, 0]) - y_min) / (y_max - y_min);
    //   }
    //   this.setState({nodeData: nodeData});
    //   this.props.setNodeEdgeData(nodeData, this.state.edgeData);
    // }

    onSaveXML() {
      var xw = new XMLWriter(true);
      xw.startDocument();
      xw.startElement('GeneTerrain');
      xw.startElement('Nodes');
      for (var i = 0; i < this.state.nodeData.length; i+=4) {
        xw.startElement('Node');
        xw.writeAttribute('NodeID', i / 4);
        xw.writeAttribute('InputValue', this.state.nodeData[i]);
        xw.writeAttribute('InputWeight', this.state.nodeData[i + 3]);
        xw.writeAttribute('NodeBackendX', this.state.nodeData[i + 1]);
        xw.writeAttribute('NodeBackendY', this.state.nodeData[i + 2]);
        xw.endElement('Node');
      }
      xw.endElement('Nodes');
      xw.startElement('Edges');
      for (var i = 0; i < this.state.edgeData.length; i+=2) {
        xw.startElement('Edge');
        xw.writeAttribute('BeginID', this.state.edgeData[i]);
        xw.writeAttribute('EndID', this.state.edgeData[i + 1]);
        xw.endElement('Edge');
      }
      xw.endElement('Edges');
      xw.endDocument();
      const element = document.createElement("a");
      const file = new Blob([xw.toString()], {type: 'application/xml'});
      element.href = URL.createObjectURL(file);
      element.download = "terrain.xml";
      document.body.appendChild(element); // Required for this to work in FireFox
      element.click();
    }
  
    render() {
      return (
        <div className="sidebar"> 
        <Form style={{color: 'white'}} onSubmit={this.handleSubmit}>
          <Form.Group controlId="formFile" className="mt-3 mb-3">
            <Form.Check defaultChecked={true} onClick={() => this.setState({jsonFormat: !this.state.jsonFormat})} type="checkbox" label="Json Format"></Form.Check>
            <Form.Label>Select Example Files</Form.Label>
            <Form.Control className="form-control" type="file" multiple onChange={(e) => {if (this.state.jsonFormat) {this.readJson(e as React.ChangeEvent<HTMLInputElement>)} else {this.readFiles(e as React.ChangeEvent<HTMLInputElement>)}}}/>
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
            <input type="range" defaultValue={0.03} min={0.001} max={0.1} step={0.001} onChange={(e) => this.props.setIdealLength(parseFloat(e.target.value))} />
            <input type="range" defaultValue={0.9} min={0.75} max={0.999} step={0.001} onChange={(e) => this.props.setCoolingFactor(parseFloat(e.target.value))} />
          </Collapsible>
          <Button onClick={(e) => this.props.onSave(false, null, null)}>
            Save Terrain
          </Button>
          <br/>
          {/* <Button onClick={(e) => this.applySpectral()}>
            Apply Spectral Layout
          </Button> */}
          <br/>
          <Button onClick={(e) => this.props.runForceDirected()}>
            Run Force Directed Layout
          </Button>
          <br/>
          <Button onClick={(e) => this.onSaveXML()}>
            Save Terrain to XML
          </Button>
        </Form>
        <Form style={{color: 'white'}} onSubmit={this.postImage}>
          <Form.Group controlId="formPost" className="mt-3 mb-3">
            <Form.Label className="mr-3">
              Name:
              <input required type="text" value={this.state.terrainName} onChange={(e) => this.setState({terrainName: e.target.value})}/>
              <br/>
              ID:
              <input required type="text" value={this.state.terrainID} onChange={(e) => this.setState({terrainID: parseInt(e.target.value)})}/>
            </Form.Label>
            <Button className="mt-2" type="submit" variant="secondary" value="Submit">Post Terrain to Database</ Button>
          </Form.Group>
        </Form>
        </ div>
      );
    }
  }

export default Sidebar;