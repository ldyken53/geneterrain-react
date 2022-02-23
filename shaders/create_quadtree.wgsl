struct Node {
    value : f32;
    x : f32;
    y : f32;
    size : f32;
};
struct Nodes {
    nodes : array<Node>;
};
struct Rectangle {
    x : f32;
    y : f32;
    w : f32;
    h : f32;
};
struct QuadTree {
    boundary : Rectangle;
    NE : u32;
    NW : u32;
    SE : u32;
    SW : u32;
    CoM : vec2<f32>;
    mass : f32;
};
struct Uniforms {
    nodes_length : u32;
    edges_length : u32;
    cooling_factor : f32;
    ideal_length : f32;
};
struct QuadTrees {
    quads : array<QuadTree>;
}

@group(0) @binding(0) var<storage, read> nodes : Nodes;
@group(0) @binding(1) var<storage, write> quads : QuadTrees;
@group(0) @binding(2) var<uniform> uniforms : Uniforms;

@stage(compute) @workgroup_size(1, 1, 1)
fn main() {
    var test = uniforms.nodes_length;
    quads.quads[0] = QuadTree(
        Rectangle(0.0, 0.0, 1.0, 1.0),
        // Can use 0 as null pointer for indexing because 0 is always root
        0u, 0u, 0u, 0u, 
        vec2<f32>(-1.0, -1.0),
        0.0
    ); 
    var counter : u32 = 1u;
    for (var i : u32 = 0u; i < 1000u; i = i + 1u) {
        var index : u32 = 0u;
        var out : i32 = 0;
        loop {
            out = out + 1;
            // We have null cell so create body
            if (quads.quads[index].mass < 1.0) {
                quads.quads[index].mass = 1.0;
                quads.quads[index].CoM = vec2<f32>(nodes.nodes[i].x, nodes.nodes[i].y);
                break;
            // Found a cell or body
            } else {
                var test : bool = false;
                let boundary : Rectangle = quads.quads[index].boundary;
                // Found body, need to partition
                if (quads.quads[index].mass < 2.0) {
                    test = true;
                    if (counter == 0u) {
                        break;
                    }
                    quads.quads[index].NW = counter;
                    if (quads.quads[index].NW == 0u) {
                        break;
                    }          
                    quads.quads[counter] = QuadTree(
                        Rectangle(boundary.x, boundary.y + boundary.h / 2.0, boundary.w / 2.0, boundary.h / 2.0),
                        0u, 0u, 0u, 0u, 
                        vec2<f32>(-1.0, -1.0),
                        0.0
                    );
                    counter = counter + 1u;
                    if (counter == 0u) {
                        break;
                    }
                    quads.quads[index].NE = counter;
                    if (quads.quads[index].NE == 0u) {
                        break;
                    }          
                    quads.quads[counter] = QuadTree(
                        Rectangle(boundary.x + boundary.w / 2.0, boundary.y + boundary.h / 2.0, boundary.w / 2.0, boundary.h / 2.0),
                        0u, 0u, 0u, 0u, 
                        vec2<f32>(-1.0, -1.0),
                        0.0
                    );
                    counter = counter + 1u;
                    if (counter == 0u) {
                        break;
                    }
                    quads.quads[index].SW = counter; 
                    if (quads.quads[index].SW == 0u) {
                        break;
                    }                             
                    quads.quads[counter] = QuadTree(
                        Rectangle(boundary.x, boundary.y, boundary.w / 2.0, boundary.h / 2.0),
                        0u, 0u, 0u, 0u, 
                        vec2<f32>(-1.0, -1.0),
                        0.0
                    );
                    counter = counter + 1u;
                    if (counter == 0u) {
                        break;
                    }
                    quads.quads[index].SE = counter; 
                    if (quads.quads[index].SE == 0u) {
                        break;
                    }                   
                    quads.quads[counter] = QuadTree(
                        Rectangle(boundary.x + boundary.w / 2.0, boundary.y, boundary.w / 2.0, boundary.h / 2.0),
                        0u, 0u, 0u, 0u, 
                        vec2<f32>(-1.0, -1.0),
                        0.0
                    );
                    counter = counter + 1u;
                    let x : f32 = quads.quads[index].CoM.x;
                    let y : f32 = quads.quads[index].CoM.y;
                    if (x <= boundary.x + boundary.w / 2.0) {
                        if (y <= boundary.y + boundary.h / 2.0) {
                            quads.quads[quads.quads[index].SW].mass = 1.0;
                            quads.quads[quads.quads[index].SW].CoM = vec2<f32>(x, y);
                        } else {
                            quads.quads[quads.quads[index].NW].mass = 1.0;
                            quads.quads[quads.quads[index].NW].CoM = vec2<f32>(x, y);     
                        }
                    } else {
                        if (y <= boundary.y + boundary.h / 2.0) {
                            quads.quads[quads.quads[index].SE].mass = 1.0;
                            quads.quads[quads.quads[index].SE].CoM = vec2<f32>(x, y);
                        } else {
                            quads.quads[quads.quads[index].NE].mass = 1.0;
                            quads.quads[quads.quads[index].NE].CoM = vec2<f32>(x, y);     
                        }
                    }
                    // if (quads.quads[index].SW == 0u || quads.quads[index].NE == 0u || quads.quads[index].SE == 0u || quads.quads[index].NW == 0u) {
                    //     break;
                    // }
                } 
                let node_x : f32 = nodes.nodes[i].x;
                let node_y : f32 = nodes.nodes[i].y;
                // We are inserting in this cell so change mass and CoM
                let mass : f32 = quads.quads[index].mass;
                quads.quads[index].CoM = (mass * quads.quads[index].CoM + vec2<f32>(node_x, node_y)) / (mass + 1.0);
                quads.quads[index].mass = mass + 1.0;
                // Find where to recurse to
                var old_index : u32 = index;
                if (node_x <= boundary.x + boundary.w / 2.0) {
                    if (node_y <= boundary.y + boundary.h / 2.0) {
                        index = quads.quads[index].SW;
                    } else {
                        index = quads.quads[index].NW;  
                    }
                } else {
                    if (node_y <= boundary.y + boundary.h / 2.0) {
                        index = quads.quads[index].SE;
                    } else {
                        index = quads.quads[index].NE;
                    }
                }
            }
        }
    }
}
