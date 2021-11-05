// Vertex shader
struct VertexOutput {
    [[builtin(position)]] Position : vec4<f32>;
    [[location(0)]] position: vec2<f32>;
    [[location(1), interpolate(flat)]] center : vec2<f32>;
};
[[block]] struct Uniforms {
  view_box : vec4<f32>;
};

[[group(0), binding(0)]] var<uniform> uniforms : Uniforms;
[[stage(vertex)]]
fn main([[location(0)]] position : vec2<f32>)
     -> VertexOutput {
    var output : VertexOutput;
    var x : f32 = position.x * (uniforms.view_box.z - uniforms.view_box.x) + uniforms.view_box.x;
    var y : f32 = position.y * (uniforms.view_box.w - uniforms.view_box.y) + uniforms.view_box.y;
    output.Position = vec4<f32>(x, y, 0.0, 1.0);
    output.position = vec2<f32>(x, y);
    // flat interpolated position will give bottom right corner, so translate to center
    output.center = position + vec2<f32>(-0.01, 0.01);
    return output;
}