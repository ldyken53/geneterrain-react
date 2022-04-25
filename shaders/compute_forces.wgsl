struct Node {
    value : f32;
    x : f32;
    y : f32;
    size : f32;
};
struct Nodes {
    nodes : array<Node>;
};
struct Edges {
    edges : array<u32>;
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
struct Batch {
    batch_id : u32;
}

@group(0) @binding(0) var<storage, read> nodes : Nodes;
@group(0) @binding(1) var<storage, read> adjmat : Edges;
@group(0) @binding(2) var<storage, write> forces : Forces;
@group(0) @binding(3) var<uniform> uniforms : Uniforms;
@group(0) @binding(4) var<uniform> batch : Batch;
@group(0) @binding(5) var<storage, read> random : Edges;

fn get_bit_selector(bit_index : u32) -> u32 {
    return 1u << bit_index;
}

fn get_nth_bit(packed : u32, bit_index : u32) -> u32 {
    return packed & get_bit_selector(bit_index);
}

@stage(compute) @workgroup_size(1, 1, 1)
fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
    let l : f32 = uniforms.ideal_length;
    var index : u32 = global_id.x;
    let node : Node = nodes.nodes[index];
    var r_force : vec2<f32> = vec2<f32>(0.0, 0.0);
    var a_force : vec2<f32> = vec2<f32>(0.0, 0.0);
    var k : u32 = 0u;
    var i : u32 = 0u;
    for (var j : u32 = random.edges[index]; j < batch.batch_id + random.edges[index]; j = j + 1u) {
    // for (var i : u32 = 0u; i < uniforms.nodes_length; i = i + 1u) {
        if (j > uniforms.nodes_length) {
            i = random.edges[k];            
            k = k + 1u;
        } else {
            i = random.edges[j];            
        }
        if (i == index) {
            continue;
        }
        var node2 : Node = nodes.nodes[i];
        var dist : f32 = distance(vec2<f32>(node.x, node.y), vec2<f32>(node2.x, node2.y));
        if (dist > 0.0){
            if (get_nth_bit(adjmat.edges[(i * uniforms.nodes_length + index) / 32u], (i * uniforms.nodes_length + index) % 32u) != 0u) {
                var dir : vec2<f32> = normalize(vec2<f32>(node2.x, node2.y) - vec2<f32>(node.x, node.y));
                a_force = a_force + ((dist * dist) / l) * dir;
            } else {
                var dir : vec2<f32> = normalize(vec2<f32>(node.x, node.y) - vec2<f32>(node2.x, node2.y));
                r_force = r_force + ((l * l) / dist) * dir;
            }
        }
    }
    var force : vec2<f32> = (a_force + r_force);
    var localForceMag: f32 = length(force); 
    if (localForceMag>0.000000001) {
        force = normalize(force) * min(uniforms.cooling_factor, length(force));
    }
    else{
        force.x = 0.0;
        force.y = 0.0;
    }
    forces.forces[index * 2u] = force.x;
    forces.forces[index * 2u + 1u] = force.y;
}
