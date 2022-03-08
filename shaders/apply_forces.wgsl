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
struct Uniforms {
    nodes_length : u32;
    edges_length : u32;
    cooling_factor : f32;
    ideal_length : f32;
};

@group(0) @binding(0) var<storage, read_write> nodes : Nodes;
@group(0) @binding(1) var<storage, read_write> forces : Forces;
// @group(0) @binding(2) var<uniform> uniforms : Uniforms;
@stage(compute) @workgroup_size(1, 1, 1)
fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
    var index : u32 = global_id.x;
    for (var iter : u32 = 0u; iter < 1u; iter = iter + 1u) {
        nodes.nodes[index].x = nodes.nodes[index].x + forces.forces[index * 2u];
        nodes.nodes[index].y = nodes.nodes[index].y + forces.forces[index * 2u + 1u]; 
        forces.forces[index * 2u] = 0.0;
        forces.forces[index * 2u + 1u] = 0.0;
        // index = index + ((uniforms.nodes_length + 11u) / 12u);
    // nodes.nodes[global_id.x].x = min(1.0, max(-1.0, nodes.nodes[global_id.x].x));
    // nodes.nodes[global_id.x].y = min(1.0, max(-1.0, nodes.nodes[global_id.x].y));
    // nodes.nodes[global_id.x].x = nodes.nodes[global_id.x].x + 0.01;
    // nodes.nodes[global_id.x].y = nodes.nodes[global_id.x].y + 0.01;
    // var test : f32 = forces.forces[0]; 
    // var test2 : f32 = nodes.nodes[0].x;
    }
}
