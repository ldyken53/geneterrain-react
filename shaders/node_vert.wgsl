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
    var inv_zoom : f32 = uniforms.view_box.z - uniforms.view_box.x;
    var expected_x : f32 = 0.5 * (1.0 - inv_zoom); 
    var expected_y : f32 = 0.5 * (1.0 - inv_zoom);
    // view_box expected to be between 0 and 1, panning need to be doubled as clip space is (-1, 1)
    var x : f32 = (position.x - 2.0 * (uniforms.view_box.x - expected_x)) / inv_zoom;
    var y : f32 = (position.y - 2.0 * (uniforms.view_box.y - expected_y)) / inv_zoom;
    output.Position = vec4<f32>(x, y, 0.0, 1.0);
    output.position = position;
    // flat interpolated position will give bottom right corner, so translate to center
    output.center = output.position + vec2<f32>(-0.01, 0.01);
    return output;
}