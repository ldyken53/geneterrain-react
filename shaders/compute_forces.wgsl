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

// struct maxForceScalar{
//     maxforceScalar: atomic<i32>;
// };

[[group(0), binding(0)]] var<storage, read> nodes : Nodes;
[[group(0), binding(1)]] var<storage, read> edges : Edges;
[[group(0), binding(2)]] var<storage, write> forces : Forces;
[[group(0), binding(3)]] var<uniform> uniforms : Uniforms;
// [[group(0), binding(4)]] var<storage, read_write> maxforce: maxForceScalar; 

[[stage(compute), workgroup_size(1, 1, 1)]]
fn main([[builtin(global_invocation_id)]] global_id : vec3<u32>) {
    let l : f32 = uniforms.ideal_length;
    let node : Node = nodes.nodes[global_id.x];
    var r_force : vec2<f32> = vec2<f32>(0.0, 0.0);
    for (var i : u32 = 0u; i < uniforms.nodes_length; i = i + 1u) {
        if (i == global_id.x) {
            continue;
        }
        var node2 : Node = nodes.nodes[i];
        var dist : f32 = distance(vec2<f32>(node.x, node.y), vec2<f32>(node2.x, node2.y));
        if(dist>0.0){
            var dir : vec2<f32> = normalize(vec2<f32>(node.x, node.y) - vec2<f32>(node2.x, node2.y));
            r_force = r_force + ((l * l) / dist) * dir;
        }

    }
    var a_force : vec2<f32> = vec2<f32>(0.0, 0.0);
    for (var i : u32 = 0u; i < 1u; i= i + 2u) {
        var node2 : Node;
        if (edges.edges[i] == global_id.x) {
            node2 = nodes.nodes[edges.edges[i + 1u]];
        } else if (edges.edges[i + 1u] == global_id.x) {
            node2 = nodes.nodes[edges.edges[i]];
        } else {
            continue;
        } 
        var dist : f32 = distance(vec2<f32>(node.x, node.y), vec2<f32>(node2.x, node2.y));
        if(dist>0.0){
            var dir : vec2<f32> = normalize(vec2<f32>(node2.x, node2.y) - vec2<f32>(node.x, node.y));
            a_force = a_force + ((dist * dist) / l) * dir;
        }
    } 
    var force : vec2<f32> = (a_force + r_force);
    var localForceMag: f32 = length(force); 
    if(localForceMag>0.000000001){
        force = normalize(force)* min(uniforms.cooling_factor, length(force));
    }
    else{
        force.x = 0.0;
        force.y = 0.0;
    }
    forces.forces[global_id.x * 2u] = force.x;
    forces.forces[global_id.x * 2u + 1u] = force.y;
    // atomicMax(&maxforce.maxforceScalar, i32(floor(localForceMag*1000.0)));
}
