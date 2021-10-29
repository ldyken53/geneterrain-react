// Vertex shader
struct VertexOutput {
    [[builtin(position)]] Position : vec4<f32>;
    [[location(0)]] position: vec2<f32>;
    [[location(1), interpolate(flat)]] center : vec2<f32>;
};

[[stage(vertex)]]
fn main([[location(0)]] position : vec2<f32>)
     -> VertexOutput {
    var output : VertexOutput;
    output.Position = vec4<f32>(position.x, position.y, 0.0, 1.0);
    output.position = position;
    // flat interpolated position will give bottom right corner, so translate to center
    output.center = position + vec2<f32>(-0.01, 0.01);
    return output;
}