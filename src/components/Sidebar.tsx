import React from 'react';
import {Form, Button} from "react-bootstrap";

type SidebarProps = {
  setNodeData: (nodeData : Array<number>) => void
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
        <Form onSubmit={this.handleSubmit}>
          <Form.Group controlId="formFile" className="mt-3 mb-3">
            <Form.Label style={{fontWeight: "bold"}}>Select Example Files</Form.Label>
            <Form.Control className="form-control" type="file" multiple onChange={this.readFiles}/>
          </Form.Group>
          <Button type="submit" variant="secondary" value="Submit">Submit</ Button>
        </Form>
        </ div>
      );
    }
  }

export default Sidebar;