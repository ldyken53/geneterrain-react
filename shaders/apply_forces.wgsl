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

[[group(0), binding(0)]] var<storage, read_write> nodes : Nodes;
[[group(0), binding(1)]] var<storage, read> forces : Forces;
[[stage(compute), workgroup_size(1, 1, 1)]]
fn main([[builtin(global_invocation_id)]] global_id : vec3<u32>) {
    nodes.nodes[global_id.x].x = nodes.nodes[global_id.x].x + forces.forces[global_id.x * 2u];
    nodes.nodes[global_id.x].y = nodes.nodes[global_id.x].y + forces.forces[global_id.x * 2u + 1u]; 
    nodes.nodes[global_id.x].x = min(1.0, max(-1.0, nodes.nodes[global_id.x].x));
    nodes.nodes[global_id.x].y = min(1.0, max(-1.0, nodes.nodes[global_id.x].y));
    // nodes.nodes[global_id.x].x = nodes.nodes[global_id.x].x + 0.01;
    // nodes.nodes[global_id.x].y = nodes.nodes[global_id.x].y + 0.01;
    // var test : f32 = forces.forces[0]; 
}
