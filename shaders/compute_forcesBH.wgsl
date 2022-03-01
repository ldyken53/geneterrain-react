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
struct Stack {
    a : array<u32>;
}
struct Forces {
    forces : array<f32>;
};
struct Uniforms {
    nodes_length : u32;
    edges_length : u32;
    cooling_factor : f32;
    ideal_length : f32;
};
struct Rectangle {
    x : f32;
    y : f32;
    w : f32;
    h : f32;
};
struct QuadTree {
    boundary : Rectangle;
    NW : f32;
    NE : f32;
    SW : f32;
    SE : f32;
    CoM : vec2<f32>;
    mass : f32;
    test : f32;
};
struct QuadTrees {
    quads : array<QuadTree>;
}

@group(0) @binding(0) var<storage, read> nodes : Nodes;
@group(0) @binding(1) var<storage, write> forces : Forces;
@group(0) @binding(2) var<uniform> uniforms : Uniforms;
@group(0) @binding(3) var<storage, read> quads : QuadTrees;
@group(0) @binding(4) var<storage, write> stack : Stack;

fn get_bit_selector(bit_index : u32) -> u32 {
    return 1u << bit_index;
}

fn get_nth_bit(packed : u32, bit_index : u32) -> u32 {
    return packed & get_bit_selector(bit_index);
}

@stage(compute) @workgroup_size(1, 1, 1)
fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
    let l : f32 = uniforms.ideal_length;
    let node : Node = nodes.nodes[global_id.x];
    var theta : f32 = 0.9;
    var r_force : vec2<f32> = vec2<f32>(0.0, 0.0);
    var a_force : vec2<f32> = vec2<f32>(forces.forces[global_id.x * 2u], forces.forces[global_id.x * 2u + 1u]);
    var index : u32 = 0u;
    var stack_index : u32 = global_id.x * 1000u;
    var counter : u32 = global_id.x * 1000u;
    var out : u32 = 0u;
    loop {
        out = out + 1u;
        if (out == 1000u) {
            break;
        }
        var quad : QuadTree = quads.quads[index];
        let dist : f32 = distance(vec2<f32>(node.x, node.y), quad.CoM);
        let s : f32 = 2.0 * quad.boundary.w;
        if (theta > s / dist) {
            var dir : vec2<f32> = normalize(vec2<f32>(node.x, node.y) - quad.CoM);
            r_force = r_force + quad.mass * ((l * l) / dist) * dir;
        } else {
            let children : array<u32, 4> = array<u32, 4>(
                u32(quads.quads[index].NW),
                u32(quads.quads[index].NE),
                u32(quads.quads[index].SW),
                u32(quads.quads[index].SE)
            );
            for (var i : u32 = 0u; i < 4u; i = i + 1u) {
                let child : u32 = children[i];
                quad = quads.quads[child];
                if (child == 0u || quad.mass < 1.0) {
                    continue;
                } else {
                    if (quad.mass > 1.0) {
                        stack.a[counter] = child;
                        counter = counter + 1u;
                    } else {
                        let dist : f32 = distance(vec2<f32>(node.x, node.y), quad.CoM);
                        if (dist > 0.0) {
                            var dir : vec2<f32> = normalize(vec2<f32>(node.x, node.y) - quad.CoM);
                            r_force = r_force + ((l * l) / dist) * dir;
                        }
                    }
                }
            }
        }
        index = stack.a[stack_index];
        if (index == 0u) {
            break;
        } 
        stack_index = stack_index + 1u;
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
    forces.forces[global_id.x * 2u] = force.x;
    forces.forces[global_id.x * 2u + 1u] = force.y;
    // forces.forces[global_id.x * 2u] = 1.0;
    // forces.forces[global_id.x * 2u + 1u] = 1.0;
}
