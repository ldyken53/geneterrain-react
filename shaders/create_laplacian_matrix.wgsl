struct Edges {
    edges : array<u32>;
};
struct BoolArray {
    matrix : array<u32>;
};
struct IntArray {
    matrix : array<i32>;
};
struct Uniforms {
    nodes_length : u32;
    edges_length : u32;
    cooling_factor : f32;
    ideal_length : f32;
};

@group(0) @binding(0) var<storage, read> adjmat : BoolArray;
@group(0) @binding(1) var<storage, read_write> laplacian : IntArray;
@group(0) @binding(2) var<uniform> uniforms : Uniforms;

@stage(compute) @workgroup_size(1, 1, 1)
fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
    for (var i : u32 = 0u; i < uniforms.nodes_length; i = i + 1u) {
        for (var j : u32 = 0u; j < uniforms.nodes_length; j = j + 1u) {
            if (adjmat.matrix[i * uniforms.nodes_length + j] == 1u && i != j) {
                laplacian[i * uniforms.nodes_length + i] = laplacian[i * uniforms.nodes_length + i] + 1;
                laplacian[i * uniforms.nodes_length + j] = -1;
            }
        }
    } 
}
