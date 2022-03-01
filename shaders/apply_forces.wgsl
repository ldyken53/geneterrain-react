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

@group(0) @binding(0) var<storage, read_write> nodes : Nodes;
@group(0) @binding(1) var<storage, read_write> forces : Forces;
@stage(compute) @workgroup_size(1, 1, 1)
fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
    // nodes.nodes[global_id.x].x = nodes.nodes[global_id.x].x + forces.forces[global_id.x * 2u];
    // nodes.nodes[global_id.x].y = nodes.nodes[global_id.x].y + forces.forces[global_id.x * 2u + 1u]; 
    var x : f32 = min(1.0, max(0.0, nodes.nodes[global_id.x].x + forces.forces[global_id.x * 2u]));
    var y : f32 = min(1.0, max(0.0, nodes.nodes[global_id.x].y + forces.forces[global_id.x * 2u + 1u]));
    // Randomize position slightly to prevent exact duplicates after clamping
    if (x == 1.0) {
        x = x - f32(global_id.x) / 5000000.0; 
    } 
    if (y == 1.0) {
        y = y - f32(global_id.x) / 5000000.0; 
    }
    if (x == 0.0) {
        x = x + f32(global_id.x) / 5000000.0; 
    }
    if (y == 0.0) {
        y = y + f32(global_id.x) / 5000000.0; 
    }
    nodes.nodes[global_id.x].x = x;
    nodes.nodes[global_id.x].y = y;
    forces.forces[global_id.x * 2u] = 0.0;
    forces.forces[global_id.x * 2u + 1u] = 0.0;
    // var test : f32 = forces.forces[0]; 
    // var test2 : f32 = nodes.nodes[0].x;
}
