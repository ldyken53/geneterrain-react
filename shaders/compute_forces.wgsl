struct Node {
    value : f32;
    x : f32;
    y : f32;
    size : f32;
};
struct Nodes {
    nodes : array<Node>;
};
struct Edge {
    source: u32;
    target: u32;
    padding1: u32;
    padding2: u32;
}
struct Edges {
    edges : array<Edge>;
}
struct Forces {
    forces : array<f32>
}

[[group(0), binding(0)]] var<storage, read> nodes : Nodes;
[[group(0), binding(1)]] var<storage, read> edges : Edges;
[[group(0), binding(2)]] var<storage, write> forces : Forces;
[[stage(compute), workgroup_size(1, 1, 1)]]
fn main([[builtin(global_invocation_id)]] global_id : vec3<u32>) {
    let l = 10;
    return;
}
