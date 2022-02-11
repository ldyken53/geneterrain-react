struct Rectangle {
    x : f32;
    y : f32;
    w : f32;
    h : f32;
};
struct Point {
    x : f32;
    y : f32;
}
struct QuadTree {
    boundary : Rectangle;
    CoM : Point;
    mass : f32;
    // NE : ptr<function, i32>;
    // NW : ptr<function, i32>;
    // SE : ptr<function, i32>;
    // SW : ptr<function, i32>;
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
struct IntArray {
    matrix : array<i32>;
};


@stage(compute) @workgroup_size(1, 1, 1)
fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {

}
