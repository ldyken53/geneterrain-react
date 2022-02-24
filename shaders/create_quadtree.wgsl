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
    NW : u32;
    NE : u32;
    SW : u32;
    SE : u32;
    CoM : vec2<f32>;
    mass : f32;
    test : f32;
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
@group(0) @binding(1) var<storage, read_write> quads : QuadTrees;
@group(0) @binding(2) var<uniform> uniforms : Uniforms;

@stage(compute) @workgroup_size(1, 1, 1)
fn main() {
    quads.quads[0] = QuadTree(
        Rectangle(0.0, 0.0, 1.0, 1.0),
        // Can use 0 as null pointer for indexing because 0 is always root
        0u, 0u, 0u, 0u, 
        vec2<f32>(-1.0, -1.0),
        0.0, 0.0
    ); 
    var counter : u32 = 1u;
    for (var i : u32 = 0u; i < uniforms.nodes_length; i = i + 1u) {
        var index : u32 = 0u;
        loop {
            // We have null cell so create body
            if (quads.quads[index].mass < 1.0) {
                quads.quads[index].mass = 1.0;
                quads.quads[index].CoM = vec2<f32>(nodes.nodes[i].x, nodes.nodes[i].y);
                break;
            }
            // Found a cell or body
            let boundary : Rectangle = quads.quads[index].boundary;
            // Found body, need to partition
            if (quads.quads[index].mass < 2.0) {
                quads.quads[index].NW = counter;                                   
                quads.quads[counter] = QuadTree(
                    Rectangle(boundary.x, boundary.y + boundary.h / 2.0, boundary.w / 2.0, boundary.h / 2.0),
                    0u, 0u, 0u, 0u, 
                    vec2<f32>(-1.0, -1.0),
                    0.0, 0.0
                );
                quads.quads[index].NE = counter + 1u;      
                quads.quads[counter + 1u] = QuadTree(
                    Rectangle(boundary.x + boundary.w / 2.0, boundary.y + boundary.h / 2.0, boundary.w / 2.0, boundary.h / 2.0),
                    0u, 0u, 0u, 0u, 
                    vec2<f32>(-1.0, -1.0),
                    0.0, 0.0
                );
                quads.quads[index].SW = counter + 2u;                                   
                quads.quads[counter + 2u] = QuadTree(
                    Rectangle(boundary.x, boundary.y, boundary.w / 2.0, boundary.h / 2.0),
                    0u, 0u, 0u, 0u, 
                    vec2<f32>(-1.0, -1.0),
                    0.0, 0.0
                );
                quads.quads[index].SE = counter + 3u;               
                quads.quads[counter + 3u] = QuadTree(
                    Rectangle(boundary.x + boundary.w / 2.0, boundary.y, boundary.w / 2.0, boundary.h / 2.0),
                    0u, 0u, 0u, 0u, 
                    vec2<f32>(-1.0, -1.0),
                    0.0, 0.0
                );
                counter = counter + 4u;
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
            } 
            let node_x : f32 = nodes.nodes[i].x;
            let node_y : f32 = nodes.nodes[i].y;
            // We are inserting in this cell so change mass and CoM
            let mass : f32 = quads.quads[index].mass;
            quads.quads[index].CoM = (mass * quads.quads[index].CoM + vec2<f32>(node_x, node_y)) / (mass + 1.0);
            quads.quads[index].mass = mass + 1.0;
            // Find where to recurse to
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
            if (index == 0u) {
                quads.quads[0].test = quads.quads[0].test + 1.0;
                break;
            }
        }
    }
}
