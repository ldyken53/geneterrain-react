struct Edges {
    edges : array<u32>;
};
struct BoolArray {
    matrix : array<u32>;
};
struct Uniforms {
    nodes_length : u32;
    edges_length : u32;
    cooling_factor : f32;
    ideal_length : f32;
};

@group(0) @binding(0) var<storage, read> edges : Edges;
@group(0) @binding(1) var<storage, read_write> adjmat : BoolArray;
@group(0) @binding(2) var<uniform> uniforms : Uniforms;

@stage(compute) @workgroup_size(1, 1, 1)
fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
    for (var i : u32 = 0u; i < uniforms.edges_length; i = i + 2u) {
        var source : u32 = edges.edges[i];
        var target : u32 = edges.edges[i + 1u];
        adjmat.matrix[source * uniforms.nodes_length + target] = 1u;
        adjmat.matrix[target * uniforms.nodes_length + source] = 1u;
    } 
}
