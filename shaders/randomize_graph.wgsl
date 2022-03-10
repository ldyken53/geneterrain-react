struct Node {
    value : f32;
    x : f32;
    y : f32;
    size : f32;
};
struct Nodes {
    nodes : array<Node>;
};
struct Batch {
    batch_id : u32;
};
struct Uniforms {
    nodes_length : u32;
    edges_length : u32;
    cooling_factor : f32;
    ideal_length : f32;
};
struct Edges {
    edges : array<u32>;
};
@group(0) @binding(0) var<storage, read_write> nodes : Nodes;
@group(0) @binding(1) var<storage, read_write> edges : Edges;
// @group(0) @binding(2) var<uniform> uniforms : Uniforms;

@stage(compute) @workgroup_size(1, 1, 1)
fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
    var test = edges.edges[0];
    var batch_index : u32 = global_id.x;
    // for (var iter = 0u; iter < 2u; iter = iter + 1u) {
        var x : f32 = nodes.nodes[batch_index].x;
        var y : f32 = nodes.nodes[batch_index].y;
        x = x * nodes.nodes[batch_index + 1u].y;
        y = y * nodes.nodes[batch_index + 1u].x;
        // Randomize position slightly to prevent exact duplicates after clamping
        if (x >= 1.0) {
            x = 1.0 - f32(batch_index) / 50000.0; 
        } 
        if (y >= 1.0) {
            y = 1.0 - f32(batch_index) / 50000.0; 
        }
        if (x <= 0.0) {
            x = 1.0; 
        }
        if (y <= 0.0) {
            y = 1.0; 
        }
        nodes.nodes[batch_index].x = x;
        nodes.nodes[batch_index].y = y;
        // forces.forces[batch_index * 2u] = 0.0;
        // forces.forces[batch_index * 2u + 1u] = 0.0;
        // var test : f32 = forces.forces[0]; 
        // var test2 : f32 = nodes.nodes[0].x;
        // batch_index = batch_index + (uniforms.nodes_length / 2u);
    // }
}
