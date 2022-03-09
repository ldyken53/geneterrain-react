struct Node {
    value : f32;
    x : f32;
    y : f32;
    size : f32;
};
struct Nodes {
    nodes : array<Node>;
};
struct Forces {
    forces : array<f32>;
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
@group(0) @binding(0) var<storage, read_write> nodes : Nodes;
@group(0) @binding(1) var<storage, read_write> forces : Forces;
// @group(0) @binding(2) var<uniform> batch : Batch;
@group(0) @binding(2) var<uniform> uniforms : Uniforms;

@stage(compute) @workgroup_size(1, 1, 1)
fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
    var batch_index : u32 = global_id.x;
    for (var iter = 0u; iter < 2u; iter = iter + 1u) {
        // nodes.nodes[batch_index].x = nodes.nodes[batch_index].x + forces.forces[batch_index * 2u];
        // nodes.nodes[batch_index].y = nodes.nodes[batch_index].y + forces.forces[batch_index * 2u + 1u]; 
        var x : f32 = min(1.0, max(0.0, nodes.nodes[batch_index].x + forces.forces[batch_index * 2u]));
        var y : f32 = min(1.0, max(0.0, nodes.nodes[batch_index].y + forces.forces[batch_index * 2u + 1u]));
        // Randomize position slightly to prevent exact duplicates after clamping
        if (x == 1.0) {
            x = x - f32(batch_index) / 500000.0; 
        } 
        if (y == 1.0) {
            y = y - f32(batch_index) / 500000.0; 
        }
        if (x == 0.0) {
            x = x + f32(batch_index) / 500000.0; 
        }
        if (y == 0.0) {
            y = y + f32(batch_index) / 500000.0; 
        }
        nodes.nodes[batch_index].x = x;
        nodes.nodes[batch_index].y = y;
        forces.forces[batch_index * 2u] = 0.0;
        forces.forces[batch_index * 2u + 1u] = 0.0;
        // var test : f32 = forces.forces[0]; 
        // var test2 : f32 = nodes.nodes[0].x;
        batch_index = batch_index + (uniforms.nodes_length / 2u);
    }
}
