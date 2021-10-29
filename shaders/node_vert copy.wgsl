// Vertex shader
struct VertexOutput {
    [[builtin(position)]] Position : vec4<f32>;
    [[location(0), interpolate(flat)]] center: vec2<f32>;
};

[[stage(vertex)]]
fn main([[builtin(vertex_index)]] vertex_index : u32, [[location(0)]] position : vec2<f32>)
     -> VertexOutput {
    var output : VertexOutput;
    output.Position = vec4<f32>(position.x, position.y, 0.0, 1.0);
    output.center = position;
    return output;
}